
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import Header from './components/Header';
import EmployeeCard from './components/EmployeeCard';
import SpecialTeamPanel from './components/SpecialTeamPanel';
import Modal from './components/Modal';
import Notification from './components/Notification';
import Footer from './components/Footer';
import InteractiveTutorial, { TutorialStep } from './components/InteractiveTutorial';
import ThemeSelectionScreen from './components/ThemeSelectionScreen';
import TurmaSelectionScreen from './components/TurmaSelectionScreen';
import LayoutSelectionScreen from './components/LayoutSelectionScreen';
import HistoryModal from './components/HistoryModal';
import ExportDropdown from './components/ExportDropdown';
import { exportToPng, exportToPdf, exportToDoc, exportToExcel, exportToTxt } from './utils/exportService';
import { SubjectIcon, UserIcon, EraserIcon, FileTextIcon, SortIcon, UserPlusIcon, ShiftIcon, AbsentIcon, TrashIcon, ExchangeIcon, MousePointerIcon, InfoIcon, HelpIcon, HistoryIcon } from './components/icons';
import { Employee, StatusType, ModalType, ManualRegistration, Administrator, HistoryRecord, HistoryEmployee, HistoryStatus, PdfReportData } from './types';
import type { NotificationData } from './components/Notification';
import { db, auth, isConfigured } from './firebase';
import { FALLBACK_LOGO } from './components/logoConstants';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    writeBatch,
    serverTimestamp,
    Timestamp,
    where,
    getDocs,
    deleteDoc,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import './styles.css';
import { formatTimestamp } from './services/employeeService';
import { logAuditEvent } from './services/auditService';
import { 
    isMobileCellularWithBiometrics, 
    hasRegisteredBiometrics, 
    registerBiometricAdmin, 
    authenticateBiometricAdmin,
    clearBiometricData
} from './services/biometricService';

import {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    TurmaType,
    ALL_TURMAS,
    TURMA_DISPLAY_NAMES,
    getTurmaCollectionName,
    getTurmaRegistrationName,
    isValidTurma,
    getShiftLabel,
    getMainShiftLabel
} from './utils/turmaUtils';
import { getTutorialSteps, adminTutorialSteps } from './utils/tutorialSteps';
import { generateHealthAlertEmail } from './utils/emailTemplates';

import { ManualRegisterSection } from './components/ManualRegisterSection';
import { ConfirmBiometricModal } from './components/modals/ConfirmBiometricModal';
import { AdminLoginModal } from './components/modals/AdminLoginModal';
import { AdminOptionsModal } from './components/modals/AdminOptionsModal';
import { AddUserModal } from './components/modals/AddUserModal';
import { ReportModal } from './components/modals/ReportModal';
import { DemoPasswordModal, AutomationPasswordModal } from './components/modals/PasswordModals';
import { ImportEmployeeModal } from './components/modals/ImportEmployeeModal';
import {
    UserExistsWarningModal,
    InvalidMatriculaModal,
    ConfirmMalModal,
    ConfirmTurnoModal,
    ConfirmAbsentModal,
    ConfirmDeleteModal,
    ConfirmDeactivate6HModal,
    TutorialChoiceModal,
    TutorialVideoModal
} from './components/modals/ActionModals';



const App: React.FC = () => {
    const [selectedTurma, setSelectedTurma] = useState<TurmaType | null>(() => {
        const savedTurma = localStorage.getItem('selectedTurma');
        if (savedTurma && isValidTurma(savedTurma)) {
            return savedTurma;
        }
        return null;
    });

    const [selectedLayout, setSelectedLayout] = useState<'standard' | 'custom' | null>(() => {
        const savedLayout = localStorage.getItem('selectedLayout');
        if (savedLayout === 'standard' || savedLayout === 'custom') {
            return savedLayout as 'standard' | 'custom';
        }
        return null;
    });

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [administrators, setAdministrators] = useState<Administrator[]>([]);
    const [allEmployeesForLookup, setAllEmployeesForLookup] = useState<(Pick<Employee, 'name' | 'matricula'>)[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.None);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [togglingSpecialTeamId, setTogglingSpecialTeamId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [activeLetter, setActiveLetter] = useState<string>('');
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null); // New wrapper ref
    const scalableContainerRef = useRef<HTMLDivElement>(null);
    const scaleStateRef = useRef({ currentScale: 1 });
    const dragScrollRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        moved: false
    });
    const modalScale = 1;

    // Refs para estabilizar callbacks sem dependência de state mutável
    const employeesRef = useRef<Employee[]>([]);
    const isAdminRef = useRef(false);
    const adminEmailRef = useRef('');

    // State for manual registration inputs
    const [mainSubject, setMainSubject] = useState('');
    const [mainMatricula, setMainMatricula] = useState('');
    const [mainResponsible, setMainResponsible] = useState('');

    const [specialSubject, setSpecialSubject] = useState('');
    const [specialMatricula, setSpecialMatricula] = useState('');
    const [specialResponsible, setSpecialResponsible] = useState('');

    const lastDbMainSubject = useRef('');
    const lastDbMainMatricula = useRef('');
    const lastDbSpecialSubject = useRef('');
    const lastDbSpecialMatricula = useRef('');

    const [pendingEmployeeId, setPendingEmployeeId] = useState<string | null>(null);
    const [existingUserInfo, setExistingUserInfo] = useState<{ name: string; turma: string } | null>(null);

    const [is6HActive, setIs6HActive] = useState(true);
    const [isAutomationPaused, setIsAutomationPaused] = useState(false);

    const [isAdminTutorialOpen, setIsAdminTutorialOpen] = useState(false);

    // Demo Mode State
    const [isDemoMode, setIsDemoMode] = useState(false);
    const isDemoModeRef = useRef(false);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const [hasSelectedTheme, setHasSelectedTheme] = useState(() => {
        return localStorage.getItem('themeSelected') === 'true';
    });

    // Ref to prevent double "loaded" notifications
    const initialLoadDoneRef = useRef(false);

    // Manter refs sincronizados com o state
    useEffect(() => { employeesRef.current = employees; }, [employees]);
    useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
    useEffect(() => { adminEmailRef.current = adminEmail; }, [adminEmail]);

    // Effect to set Favicon to the Shield Icon (FALLBACK_LOGO)
    useEffect(() => {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
            link.href = FALLBACK_LOGO;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = FALLBACK_LOGO;
            document.head.appendChild(newLink);
        }
    }, []);

    useLayoutEffect(() => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            // FIX: Set body background to match theme to prevent white flashes during overscroll/bounce
            document.body.style.backgroundColor = '#111217';
            // FIX: Update theme-color meta tag for mobile browsers (status bar color)
            if (themeColorMeta) themeColorMeta.setAttribute('content', '#111217');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            // FIX: Set body background to match theme (light-bg-secondary color)
            document.body.style.backgroundColor = '#e8ecf1';
            // FIX: Update theme-color meta tag for mobile browsers (status bar color)
            if (themeColorMeta) themeColorMeta.setAttribute('content', '#e8ecf1');
        }
    }, [isDarkMode]);

    // modalScale é sempre 1 (definido como constante acima)

    useEffect(() => {
        // Wait for loading to finish so DOM elements are present
        let timeoutId: NodeJS.Timeout;
        if (!loading && selectedTurma) {
            const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
            if (!hasSeenTutorial) {
                // Short delay to ensure rendering frames are complete
                timeoutId = setTimeout(() => {
                    setActiveModal(ModalType.TutorialChoice);
                    localStorage.setItem('hasSeenTutorial', 'true');
                }, 1500);
            }
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [loading, selectedTurma]);

    const handleToggleDarkMode = useCallback((e?: any) => {
        if (!('startViewTransition' in document)) {
            setIsDarkMode(prev => !prev);
            return;
        }

        const isSwitchingToDark = !isDarkMode;

        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        
        if (e && e.nativeEvent && typeof e.nativeEvent.clientX === 'number' && e.nativeEvent.clientX > 0) {
            x = e.nativeEvent.clientX;
            y = e.nativeEvent.clientY;
        } else if (e && e.target instanceof Element) {
            const targetEl = e.target.closest('.bb8-toggle') || e.target;
            const rect = targetEl.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
        }

        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        document.documentElement.style.setProperty('--toggle-x', `${x}px`);
        document.documentElement.style.setProperty('--toggle-y', `${y}px`);
        document.documentElement.style.setProperty('--toggle-r', `${endRadius}px`);

        const transitionClass = isSwitchingToDark ? 'dark-transition' : 'light-transition';
        document.documentElement.classList.add(transitionClass);

        const transition = (document as any).startViewTransition(() => {
            flushSync(() => {
                setIsDarkMode(prev => !prev);
            });
        });

        transition.finished.finally(() => {
            document.documentElement.classList.remove(transitionClass);
            document.documentElement.style.removeProperty('--toggle-x');
            document.documentElement.style.removeProperty('--toggle-y');
            document.documentElement.style.removeProperty('--toggle-r');
        });
    }, [isDarkMode]);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const newNotification = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Função para enviar alerta por e-mail
    const sendAlertEmail = async (name: string, matricula: string, turno: string) => {
        if (isDemoMode) {
            console.log(`[DEMO] Email alert triggered for ${name}`);
            return;
        }
        try {
            const { html: html_content, subject } = generateHealthAlertEmail(
                name,
                matricula,
                turno,
                selectedTurma!
            );

            const templateParams = {
                html_content,
                subject,
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );

            showNotification('Alerta enviado por e-mail ao setor responsável.', 'success');
        } catch (error) {
            console.error("Erro ao enviar e-mail via EmailJS:", error);
        }
    };

    // Effect for one-time global data fetching (like the employee lookup list)
    useEffect(() => {
        const fetchGlobalData = async () => {
            const currentDb = db;
            if (!isConfigured || !currentDb) return;

            try {
                await signInAnonymously(auth!);
                console.log("Signed in anonymously for global data fetch.");

                if (allEmployeesForLookup.length === 0) {
                    const promises = ALL_TURMAS.map(turma => getDocs(query(collection(currentDb, getTurmaCollectionName(turma)))));

                    const snapshots = await Promise.all(promises);
                    const allEmps: Pick<Employee, 'name' | 'matricula'>[] = [];
                    snapshots.forEach(snapshot => {
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.name && data.matricula) {
                                allEmps.push({ name: data.name, matricula: data.matricula });
                            }
                        });
                    });

                    const uniqueEmps = Array.from(new Map(allEmps.map(item => [item.matricula, item])).values());
                    setAllEmployeesForLookup(uniqueEmps);
                }
            } catch (error) {
                console.error("Global data fetch or anonymous sign-in failed:", error);
            }
        }
        fetchGlobalData();
    }, []); // Empty dependency array ensures this runs only once

    // Effect for fetching data specific to the selected Turma
    useEffect(() => {
        if (!selectedTurma) {
            setLoading(false);
            return;
        }

        if (!isConfigured) {
            showNotification("Modo de pré-visualização: Faça o deploy no Vercel para carregar dados ao vivo.", "error");
            setLoading(false);
            return;
        }

        initialLoadDoneRef.current = false; // Reset notification flag when turma changes

        let unsubscribeEmployees = () => { };
        let unsubscribeAdministrators = () => { };
        let unsubscribeRegistrations = () => { };
        let unsubscribeAutomacao = () => { };

        const setupListeners = async () => {
            if (!db) return;
            try {
                // Listeners for the specific turma
                const collectionName = getTurmaCollectionName(selectedTurma);
                const employeesQuery = query(collection(db, collectionName), orderBy("name", "asc"));
                unsubscribeEmployees = onSnapshot(employeesQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;

                    setEmployees(prevEmployees => {
                        let newEmployees = [...prevEmployees];
                        querySnapshot.docChanges().forEach(change => {
                            const data = change.doc.data();
                            const employeeData: Employee = {
                                id: change.doc.id,
                                name: data.name,
                                matricula: data.matricula,
                                assDss: data.assDss,
                                bem: data.bem,
                                mal: data.mal,
                                absent: data.absent,
                                time: data.time ? formatTimestamp(data.time as Timestamp) : null,
                                turno: data.turno || '7H',
                            };

                            if (change.type === 'added') {
                                if (!newEmployees.some(e => e.id === employeeData.id)) {
                                    newEmployees.push(employeeData);
                                }
                            } else if (change.type === 'modified') {
                                const index = newEmployees.findIndex(e => e.id === employeeData.id);
                                if (index !== -1) {
                                    newEmployees[index] = employeeData;
                                }
                            } else if (change.type === 'removed') {
                                newEmployees = newEmployees.filter(e => e.id !== employeeData.id);
                            }
                        });

                        if (querySnapshot.docChanges().length > 0) {
                            return newEmployees.sort((a, b) => a.name.localeCompare(b.name));
                        }
                        return prevEmployees;
                    });

                    if (!initialLoadDoneRef.current) {
                        setLoading(false);
                        showNotification(`Dados da Turma ${TURMA_DISPLAY_NAMES[selectedTurma]} carregados!`, 'success');
                        initialLoadDoneRef.current = true;
                    }

                }, (error) => {
                    console.error("Error listening to employee updates:", error);
                    if (!isDemoModeRef.current) showNotification(`Erro ao carregar funcionários: ${error.message}`, "error");
                    setLoading(false);
                });

                const administratorsQuery = query(collection(db, 'administrators'));
                unsubscribeAdministrators = onSnapshot(administratorsQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;
                    const adminsData: Administrator[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Administrator));
                    setAdministrators(adminsData);
                }, (error) => console.error("Error listening to admin updates:", error));

                const registrationCollectionName = getTurmaRegistrationName(selectedTurma);
                const registrationsQuery = query(collection(db, registrationCollectionName));
                unsubscribeRegistrations = onSnapshot(registrationsQuery, (querySnapshot) => {
                    if (isDemoModeRef.current) return;
                    const registrations = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ManualRegistration[];
                    const mainReg = registrations.find(r => r.TURNO === '7H');
                    const specialReg = registrations.find(r => r.TURNO === '6H');
                    
                    const config6H = querySnapshot.docs.find(d => d.id === 'config_6H');
                    if (config6H) {
                        setIs6HActive(config6H.data().active ?? true);
                    } else {
                        setIs6HActive(true);
                    }
                    
                    const newDbMainSubject = mainReg?.assunto || '';
                    const newDbMainMatricula = mainReg?.matricula || '';
                    const newDbSpecialSubject = specialReg?.assunto || '';
                    const newDbSpecialMatricula = specialReg?.matricula || '';

                    if (newDbMainSubject !== lastDbMainSubject.current) {
                        setMainSubject(newDbMainSubject);
                        lastDbMainSubject.current = newDbMainSubject;
                    }
                    if (newDbMainMatricula !== lastDbMainMatricula.current) {
                        setMainMatricula(newDbMainMatricula);
                        lastDbMainMatricula.current = newDbMainMatricula;
                    }
                    setMainResponsible(mainReg?.name || '');

                    if (newDbSpecialSubject !== lastDbSpecialSubject.current) {
                        setSpecialSubject(newDbSpecialSubject);
                        lastDbSpecialSubject.current = newDbSpecialSubject;
                    }
                    if (newDbSpecialMatricula !== lastDbSpecialMatricula.current) {
                        setSpecialMatricula(newDbSpecialMatricula);
                        lastDbSpecialMatricula.current = newDbSpecialMatricula;
                    }
                    setSpecialResponsible(specialReg?.name || '');
                });

                const configAutomacaoQuery = doc(db, 'configuracoes', 'automacao');
                unsubscribeAutomacao = onSnapshot(configAutomacaoQuery, (docSnap) => {
                    if (isDemoModeRef.current) return;
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setIsAutomationPaused(data[selectedTurma] === true);
                    } else {
                        setIsAutomationPaused(false);
                    }
                }, (error) => console.error("Error listening to automacao updates:", error));

            } catch (error) {
                console.error("Listener setup failed:", error);
                const message = error instanceof Error ? error.message : 'Verifique as credenciais.';
                if (!isDemoModeRef.current) showNotification(`Falha na conexão: ${message}`, "error");
                setLoading(false);
            }
        };

        setupListeners();

        return () => {
            unsubscribeEmployees();
            unsubscribeAdministrators();
            unsubscribeRegistrations();
            unsubscribeAutomacao();
        };
    }, [selectedTurma]);

    const setScale = useCallback((newScale: number, scrollX?: number, scrollY?: number) => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;
        const contentWrapper = contentWrapperRef.current;
        if (!viewport || !scalableContainer || !contentWrapper) return;

        // Calcular escala mínima com a LARGURA ORIGINAL INTOCADA (scalableContainerRef)
        // Isso impede a "Tremedeira Matemática" descrita, pois a raiz nunca encolhe.
        let minScale = 0.2;
        if (scalableContainer.offsetWidth > 0) {
            minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
        }

        const finalScale = Math.max(minScale, Math.min(newScale, 2.0));
        scaleStateRef.current.currentScale = finalScale;

        scalableContainer.style.transform = `scale(${finalScale})`;

        const originalWidth = scalableContainer.offsetWidth;
        const originalHeight = scalableContainer.offsetHeight;

        contentWrapper.style.width = `${originalWidth * finalScale}px`;
        contentWrapper.style.height = `${originalHeight * finalScale}px`;

        if (scrollX !== undefined) viewport.scrollLeft = scrollX;
        if (scrollY !== undefined) viewport.scrollTop = scrollY;
    }, []);

    const initializeScale = useCallback(() => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;
        if (!viewport || !scalableContainer) return;

        const isMobileView = ('ontouchstart' in window || navigator.maxTouchPoints > 0) || window.innerWidth < 1366;

        if (isMobileView) {
            const oneColumnScale = viewport.clientWidth / 920;
            const finalScale = Math.min(Math.max(oneColumnScale, 0.3), 1.0);
            setScale(finalScale, 0, 0);
        } else {
            setScale(1.0, 0, 0);
        }
    }, [setScale]);


    useEffect(() => {
        const viewport = viewportRef.current;
        const scalableContainer = scalableContainerRef.current;

        if (!viewport || !scalableContainer) return;

        initializeScale();
        const initTimer = setTimeout(initializeScale, 50);

        let initialDistance = 0;
        let initialScale = 1;
        let scrollStart = { x: 0, y: 0 };
        let touchCenter = { x: 0, y: 0 };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                initialScale = scaleStateRef.current.currentScale;
                scrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };
                touchCenter = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                const scaleRatio = currentDistance / initialDistance;
                let newScale = initialScale * scaleRatio;

                let minScale = 0.2;
                const scalableContainer = scalableContainerRef.current;
                if (scalableContainer && scalableContainer.offsetWidth > 0) {
                    minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
                }

                if (newScale < minScale) {
                    newScale = minScale;
                    if (scaleStateRef.current.currentScale === minScale) {
                        return; // Anti-Shake: Aborta a continuação matemática do offsetX se já estivermos travados
                    }
                }

                const originX = touchCenter.x - viewport.getBoundingClientRect().left;
                const originY = touchCenter.y - viewport.getBoundingClientRect().top;

                const contentOriginX = (scrollStart.x + originX) / initialScale;
                const contentOriginY = (scrollStart.y + originY) / initialScale;

                const newScrollX = (contentOriginX * newScale) - originX;
                const newScrollY = (contentOriginY * newScale) - originY;

                setScale(newScale, newScrollX, newScrollY);
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const zoomIntensity = 0.002;
                const delta = -e.deltaY * zoomIntensity;
                let newScale = scaleStateRef.current.currentScale + delta * scaleStateRef.current.currentScale;

                let minScale = 0.2;
                const scalableContainer = scalableContainerRef.current;
                if (scalableContainer && scalableContainer.offsetWidth > 0) {
                    minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
                }

                if (newScale < minScale) {
                    newScale = minScale;
                    if (scaleStateRef.current.currentScale === minScale) {
                        return; // Faz com que rolar o scroll no limite para trás ignore calclos de offset fantasmas
                    }
                }

                const originX = e.clientX - viewport.getBoundingClientRect().left;
                const originY = e.clientY - viewport.getBoundingClientRect().top;

                const contentOriginX = (viewport.scrollLeft + originX) / scaleStateRef.current.currentScale;
                const contentOriginY = (viewport.scrollTop + originY) / scaleStateRef.current.currentScale;

                const newScrollX = (contentOriginX * newScale) - originX;
                const newScrollY = (contentOriginY * newScale) - originY;

                setScale(newScale, newScrollX, newScrollY);
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            // Não iniciar drag se clicar em botões, inputs ou áreas interativas
            const target = e.target as HTMLElement;
            if (target.closest('button, input, select, textarea, a, [role="button"]')) {
                return;
            }

            dragScrollRef.current.isDragging = true;
            dragScrollRef.current.moved = false;
            dragScrollRef.current.startX = e.pageX - viewport.offsetLeft;
            dragScrollRef.current.startY = e.pageY - viewport.offsetTop;
            dragScrollRef.current.scrollLeft = viewport.scrollLeft;
            dragScrollRef.current.scrollTop = viewport.scrollTop;
            
            viewport.style.cursor = 'grabbing';
            viewport.style.userSelect = 'none';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragScrollRef.current.isDragging) return;
            
            e.preventDefault();
            const x = e.pageX - viewport.offsetLeft;
            const y = e.pageY - viewport.offsetTop;
            const walkX = (x - dragScrollRef.current.startX);
            const walkY = (y - dragScrollRef.current.startY);

            if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
                dragScrollRef.current.moved = true;
            }

            viewport.scrollLeft = dragScrollRef.current.scrollLeft - walkX;
            viewport.scrollTop = dragScrollRef.current.scrollTop - walkY;
        };

        const handleMouseUp = () => {
            if (!dragScrollRef.current.isDragging) return;
            dragScrollRef.current.isDragging = false;
            viewport.style.cursor = 'grab';
            viewport.style.removeProperty('user-select');
        };

        let lastWidth = window.innerWidth;
        const handleResize = () => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                return;
            }

            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                setScale(scaleStateRef.current.currentScale);
                initializeScale();
            }
        };

        window.addEventListener('load', initializeScale);
        window.addEventListener('resize', handleResize);
        viewport.addEventListener('wheel', handleWheel, { passive: false });
        viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
        viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        // Mouse Events for Drag-to-Scroll
        viewport.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        // Set initial cursor
        viewport.style.cursor = 'grab';

        return () => {
            clearTimeout(initTimer);
            window.removeEventListener('load', initializeScale);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (viewport) {
                viewport.removeEventListener('wheel', handleWheel);
                viewport.removeEventListener('touchstart', handleTouchStart);
                viewport.removeEventListener('touchmove', handleTouchMove);
                viewport.removeEventListener('mousedown', handleMouseDown);
            }
        };

    }, [initializeScale, setScale, selectedTurma, selectedLayout]);

    const handleConfirmDemoPassword = (password: string) => {
        if (password === 'Near2203@') {
            handleEnterDemoMode();
        } else {
            showNotification('Senha incorreta.', 'error');
            setActiveModal(ModalType.AdminOptions);
        }
    };

    const handleEnterDemoMode = () => {
        if (!selectedTurma) {
            showNotification('Selecione uma turma antes de entrar no modo de demonstração.', 'error');
            return;
        }
        isDemoModeRef.current = true;

        const firstNames = ["João", "Maria", "Pedro", "Ana", "Carlos", "Fernanda", "Lucas", "Juliana", "Marcos", "Beatriz", "Rafael", "Camila", "Gustavo", "Larissa", "Bruno"];
        const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins"];

        const generateName = () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            return `${first} ${last}`;
        };

        const mockEmployees: Employee[] = Array.from({ length: 45 }).map((_, i) => {
            const isPresent = Math.random() > 0.3;
            const isBem = isPresent && Math.random() > 0.1;
            const isMal = isPresent && !isBem;
            const isAbsent = !isPresent;

            return {
                id: `demo-${i}`,
                name: generateName(),
                matricula: `${1000 + i}`,
                assDss: isBem,
                bem: isBem,
                mal: isMal,
                absent: isAbsent,
                time: isPresent ? formatTimestamp(Timestamp.now()) : null,
                turno: i < 35 ? '7H' : '6H'
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        const mockAdmins: Administrator[] = [
            { id: 'admin1', name: 'Admin Demo User', matricula: '9999', email: 'admin@demo.com' }
        ];

        setEmployees(mockEmployees);
        setAdministrators(mockAdmins);
        setIsDemoMode(true);
        setIsAdmin(true);
        setActiveModal(ModalType.None);
        setLoading(false);
        showNotification('Modo de Demonstração Ativado! Dados fictícios carregados.', 'success');
    };

    const processStatusUpdate = useCallback(async (id: string, type: StatusType) => {
        if (!selectedTurma) return;
        const employee = employeesRef.current.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        if (!isChecking && !isAdminRef.current) {
            showNotification('Apenas administradores podem desmarcar esta opção.', 'error');
            return;
        }

        const updatedData: { [key: string]: any } = {};

        if (type === 'absent') {
            updatedData.absent = isChecking;
            if (isChecking) {
                updatedData.assDss = false;
                updatedData.bem = false;
                updatedData.mal = false;
            }
        } else {
            if (isChecking) {
                updatedData.absent = false;
            }

            if (type === 'assDss') {
                updatedData.assDss = isChecking;
            } else if (type === 'bem') {
                updatedData.bem = isChecking;
                if (isChecking) {
                    updatedData.assDss = true;
                    updatedData.mal = false;
                }
            } else if (type === 'mal') {
                updatedData.mal = isChecking;
                if (isChecking) {
                    updatedData.bem = false;
                    sendAlertEmail(employee.name, employee.matricula, employee.turno);
                }
            }
        }

        if (isDemoMode) {
            const finalStates = {
                absent: updatedData.absent !== undefined ? updatedData.absent : employee.absent,
                assDss: updatedData.assDss !== undefined ? updatedData.assDss : employee.assDss,
                bem: updatedData.bem !== undefined ? updatedData.bem : employee.bem,
                mal: updatedData.mal !== undefined ? updatedData.mal : employee.mal,
            };

            let newTime = employee.time;
            if (finalStates.absent) {
                newTime = null;
            } else if (finalStates.assDss) {
                if (!newTime) {
                    const date = new Date();
                    newTime = `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                }
            } else {
                newTime = null;
            }

            setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updatedData, time: newTime } : e));
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const finalStates = {
                absent: updatedData.absent !== undefined ? updatedData.absent : employee.absent,
                assDss: updatedData.assDss !== undefined ? updatedData.assDss : employee.assDss,
                bem: updatedData.bem !== undefined ? updatedData.bem : employee.bem,
                mal: updatedData.mal !== undefined ? updatedData.mal : employee.mal,
            };

            if (finalStates.absent) {
                updatedData.time = null;
            } else if (finalStates.assDss) {
                if (!employee.time) {
                    updatedData.time = serverTimestamp();
                }
            } else {
                updatedData.time = null;
            }
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedData);
            logAuditEvent(adminEmailRef.current, 'STATUS_CHANGE', `Funcionário: ${employee.name} | Alteração: ${type} → ${isChecking ? 'marcado' : 'desmarcado'}`, selectedTurma);
        } catch (error) {
            console.error("Error updating status:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar status: ${message}`, 'error');
        }
    }, [selectedTurma, showNotification, isDemoMode]);

    const handleTimeUpdate = useCallback(async (id: string, newDate: Date | null) => {
        if (!isAdminRef.current) {
            showNotification('Apenas administradores podem editar o horário.', 'error');
            return;
        }

        if (isDemoMode) {
            const newTimeStr = newDate ? `${newDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${newDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : null;
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, time: newTimeStr } : e));
            showNotification('Horário atualizado com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db || !selectedTurma) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                time: newDate ? Timestamp.fromDate(newDate) : null
            });
            showNotification('Horário atualizado com sucesso!', 'success');
            const emp = employeesRef.current.find(e => e.id === id);
            logAuditEvent(adminEmailRef.current, 'EDIT_TIME', `Funcionário: ${emp?.name || id} | Novo horário: ${newDate ? newDate.toLocaleString('pt-BR') : 'Vazio'}`, selectedTurma);
        } catch (error) {
            console.error("Error updating time:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar horário: ${message}`, 'error');
        }
    }, [isAdminRef, isDemoMode, db, selectedTurma, showNotification]);

    const handleMatriculaUpdate = useCallback(async (id: string, newMatricula: string) => {
        if (!isAdminRef.current) {
            showNotification('Apenas administradores podem editar a matrícula.', 'error');
            return;
        }

        if (isDemoMode) {
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, matricula: newMatricula } : e));
            showNotification('Matrícula atualizada com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db || !selectedTurma) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = getTurmaCollectionName(selectedTurma);

            // Check for duplicates
            const q = query(collection(db, collectionName), where("matricula", "==", newMatricula));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty && querySnapshot.docs[0].id !== id) {
                showNotification('Esta matrícula já está em uso por outro funcionário.', 'error');
                return;
            }

            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                matricula: newMatricula
            });
            showNotification('Matrícula atualizada com sucesso!', 'success');
            const emp = employeesRef.current.find(e => e.id === id);
            logAuditEvent(adminEmailRef.current, 'EDIT_MATRICULA', `Funcionário: ${emp?.name || id} | Nova matrícula: ${newMatricula}`, selectedTurma);
        } catch (error) {
            console.error("Error updating matricula:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar matrícula: ${message}`, 'error');
        }
    }, [isAdminRef, isDemoMode, db, selectedTurma, showNotification]);

    const handleStatusChange = useCallback((id: string, type: StatusType) => {
        const employee = employeesRef.current.find(e => e.id === id);
        if (!employee) return;

        const isChecking = !(employee as any)[type];

        if (type === 'mal' && isChecking) {
            setPendingEmployeeId(id);
            setActiveModal(ModalType.ConfirmMal);
            return;
        }

        if (type === 'absent' && isChecking) {
            setPendingEmployeeId(id);
            setActiveModal(ModalType.ConfirmAbsent);
            return;
        }

        processStatusUpdate(id, type);
    }, [processStatusUpdate]);

    const handleConfirmMal = useCallback(() => {
        if (pendingEmployeeId) {
            processStatusUpdate(pendingEmployeeId, 'mal');
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processStatusUpdate]);

    const handleConfirmAbsent = useCallback(() => {
        if (pendingEmployeeId) {
            processStatusUpdate(pendingEmployeeId, 'absent');
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processStatusUpdate]);

    const processToggleSpecialTeam = useCallback(async (id: string) => {
        if (!selectedTurma) return;
        setTogglingSpecialTeamId(id);
        const employee = employeesRef.current.find(e => e.id === id);
        if (!employee) {
            setTogglingSpecialTeamId(null);
            return;
        }
        const newTurno = employee.turno === '6H' ? '7H' : '6H';
        const displayTurno = employee.turno === '6H' ? getMainShiftLabel(selectedTurma) : getShiftLabel(selectedTurma);

        if (isDemoMode) {
            setTimeout(() => {
                setEmployees(prev => prev.map(e => e.id === id ? { ...e, turno: newTurno } : e));
                showNotification(`${employee.name} foi movido para o turno ${displayTurno} (DEMO).`, 'success');
                setTogglingSpecialTeamId(null);
            }, 500);
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                turno: newTurno
            });
            showNotification(`${employee.name} foi movido para o turno ${displayTurno}.`, 'success');
            logAuditEvent(adminEmailRef.current, 'TOGGLE_TURNO', `Funcionário: ${employee.name} | Novo turno: ${displayTurno}`, selectedTurma);
        } catch (error) {
            console.error("Failed to toggle special team status:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao atualizar status: ${message}`, 'error');
        } finally {
            setTogglingSpecialTeamId(null);
        }
    }, [selectedTurma, isDemoMode, db, showNotification]);

    const handleToggleSpecialTeam = useCallback((id: string) => {
        setPendingEmployeeId(id);
        setActiveModal(ModalType.ConfirmTurno);
    }, []);

    const handleConfirmTurno = useCallback(() => {
        if (pendingEmployeeId) {
            processToggleSpecialTeam(pendingEmployeeId);
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processToggleSpecialTeam]);

    const processDeleteUser = useCallback(async (employeeId: string) => {
        if (!selectedTurma) return;
        const employeeToDelete = employeesRef.current.find(e => e.id === employeeId);
        if (!employeeToDelete) return;

        if (isDemoMode) {
            setEmployees(prev => prev.filter(e => e.id !== employeeId));
            showNotification(`Usuário ${employeeToDelete.name} deletado com sucesso (DEMO)!`, 'success');
            return;
        }
        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }
        try {
            const collectionName = getTurmaCollectionName(selectedTurma);
            const docRef = doc(db, collectionName, employeeId);
            await deleteDoc(docRef);
            showNotification(`Usuário ${employeeToDelete.name} deletado com sucesso!`, 'success');
            logAuditEvent(adminEmailRef.current, 'DELETE_USER', `Funcionário deletado: ${employeeToDelete.name} (Matrícula: ${employeeToDelete.matricula})`, selectedTurma);
        } catch (error) {
            console.error("Error deleting user:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao deletar: ${message}`, 'error');
        }
    }, [selectedTurma, isDemoMode, db, showNotification]);

    const handleDeleteUser = useCallback((employeeId: string) => {
        if (!isAdminRef.current) {
            showNotification('Apenas administradores podem deletar usuários.', 'error');
            return;
        }
        const employeeToDelete = employeesRef.current.find(e => e.id === employeeId);
        if (!employeeToDelete) {
            showNotification('Usuário não encontrado.', 'error');
            return;
        }

        setPendingEmployeeId(employeeId);
        setActiveModal(ModalType.ConfirmDelete);
    }, [showNotification]);

    const handleConfirmDelete = useCallback(() => {
        if (pendingEmployeeId) {
            processDeleteUser(pendingEmployeeId);
            setPendingEmployeeId(null);
            setActiveModal(ModalType.None);
        }
    }, [pendingEmployeeId, processDeleteUser]);

    const handleToggle6H = useCallback(() => {
        if (!isAdminRef.current || !selectedTurma) {
            showNotification('Apenas administradores podem alterar as opções do turno.', 'error');
            return;
        }
        
        if (is6HActive) {
            setActiveModal(ModalType.ConfirmDeactivate6H);
        } else {
            // Reativar direto
            processToggle6HState(true);
        }
    }, [is6HActive, selectedTurma, showNotification]);

    const processToggle6HState = useCallback(async (active: boolean) => {
        if (!selectedTurma) return;

        if (isDemoMode) {
            if (!active) {
                // Ao desativar, move todos do 6H pro 7H
                setEmployees(prev => prev.map(e => e.turno === '6H' ? { ...e, turno: '7H' } : e));
            }
            setIs6HActive(active);
            showNotification(active ? 'Turno 6H Ativado (DEMO)' : 'Turno 6H Desativado e funcionários movidos para 7H (DEMO)', 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const batch = writeBatch(db);

            if (!active) {
                // Move everyone to 7H
                const collectionName = getTurmaCollectionName(selectedTurma);
                const employeesSnap = await getDocs(query(collection(db, collectionName), where("turno", "==", "6H")));
                employeesSnap.forEach(doc => {
                    batch.update(doc.ref, { turno: '7H' });
                });
            }

            // Save settings explicitly in the registration collection as config_6H
            const docRef = doc(db, getTurmaRegistrationName(selectedTurma), 'config_6H');
            batch.set(docRef, { active }, { merge: true });

            await batch.commit();

            const label = getShiftLabel(selectedTurma);
            showNotification(active ? `Turno ${label} Ativado com sucesso!` : `Turno ${label} Desativado. Todos os funcionários foram movidos para 7H.`, 'success');
            logAuditEvent(adminEmailRef.current, 'TOGGLE_6H_COLUMN', `Turno ${label}: ${active ? 'Ativado' : 'Desativado'}`, selectedTurma);
        } catch (error) {
            console.error("Error toggling 6H state:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao alterar estado do turno: ${message}`, 'error');
        }
    }, [selectedTurma, isDemoMode, db, showNotification]);

    const handleConfirmDeactivate6H = useCallback(() => {
        processToggle6HState(false);
        setActiveModal(ModalType.None);
    }, [processToggle6HState]);

    const handleManualRegister = useCallback(async (turno: '7H' | '6H', matricula: string, rawSubject: string) => {
        if (!selectedTurma) return;

        const subject = rawSubject ? rawSubject.toUpperCase() : '';

        if (!matricula) {
            showNotification('Por favor, insira uma matrícula.', 'error');
            return;
        }

        if (matricula.length !== 8) {
            setActiveModal(ModalType.InvalidMatricula);
            return;
        }

        const admin = administrators.find(a => a.matricula === matricula);
        const emp = allEmployeesForLookup.find(e => e.matricula === matricula);
        const resolvedName = admin ? admin.name : (emp ? emp.name : '');

        if (isDemoMode) {
            showNotification(`Registro para turno ${turno} salvo com sucesso (DEMO).`, 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        const registrationCollectionName = getTurmaRegistrationName(selectedTurma);
        const docId = `registro_${turno}`; // Creates a predictable ID like "registro_7H" or "registro_6H"
        const docRef = doc(db, registrationCollectionName, docId);

        const registrationData = {
            matricula,
            name: resolvedName,
            assunto: subject || 'Não preenchido',
            TURNO: turno, // Explicitly using the '7H' or '6H' parameter
        };

        try {
            // setDoc will create the document if it doesn't exist, or completely overwrite it if it does.
            // This simplifies the logic from query/update/add to a single operation.
            await setDoc(docRef, registrationData);

            showNotification(`Registro para turno ${turno} salvo com sucesso.`, 'success');
            logAuditEvent(adminEmail, 'MANUAL_REGISTER', `Registro manual salvo | Turno: ${turno} | Matrícula: ${matricula} | Assunto: ${subject || 'Não preenchido'}`, selectedTurma);
        } catch (error) {
            console.error("Error saving manual registration:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao salvar registro: ${message}`, 'error');
        }
    }, [selectedTurma, isDemoMode, db, administrators, allEmployeesForLookup, showNotification]);

    const handleAdminLogin = async (email: string) => {
        const normalizedEmail = email.trim().toLowerCase();

        const isFirstAdminLogin = !localStorage.getItem('hasSeenAdminTutorial');

        const processLogin = async (isDemo = false) => {
            setIsAdmin(true);
            setAdminEmail(normalizedEmail);
            
            // Sugere registro biométrico se estiver no celular e biometria ainda não estiver cadastrada
            const isCell = await isMobileCellularWithBiometrics();
            const alreadyRegistered = hasRegisteredBiometrics();
            if (isCell && !alreadyRegistered && !isDemo) {
                setActiveModal(ModalType.ConfirmBiometric);
            } else {
                setActiveModal(ModalType.AdminOptions);
            }
            
            showNotification(isDemo ? 'Acesso Admin (DEMO) concedido.' : 'Login de administrador bem-sucedido!', 'success');

            if (!isDemo) {
                logAuditEvent(normalizedEmail, 'LOGIN', `Admin logou no sistema`, selectedTurma);
            }

            if (isFirstAdminLogin) {
                localStorage.setItem('hasSeenAdminTutorial', 'true');
                setIsAdminTutorialOpen(true);
            }
        };

        if (normalizedEmail === 'naylanmoreira350@gmail.com') {
            await processLogin();
            return;
        }

        if (isDemoMode) {
            await processLogin(true);
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }
        if (!email) {
            showNotification('Por favor, insira um e-mail.', 'error');
            return;
        }
        try {
            const q = query(collection(db, 'administrators'), where("email", "==", normalizedEmail));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                await processLogin();
            } else {
                showNotification('Credenciais de administrador inválidas.', 'error');
            }
        } catch (error) {
            console.error("Admin login error:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Erro no login: ${message}`, 'error');
        }
    };

    const handleAddUser = async (name: string, matricula: string, addAnother: boolean) => {
        if (!isAdmin || !selectedTurma) {
            showNotification('Apenas administradores podem adicionar usuários.', 'error');
            return;
        }

        if (!name.trim() || !matricula.trim()) {
            showNotification('Nome e matrícula são obrigatórios.', 'error');
            return;
        }

        const finalName = name.toUpperCase();

        if (isDemoMode) {
            const newUser: Employee = {
                id: `demo-new-${Date.now()}`,
                name: finalName,
                matricula,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
                turno: '7H'
            };
            setEmployees(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
            if (!addAnother) {
                setActiveModal(ModalType.None);
            }
            showNotification(`Usuário ${finalName} adicionado com sucesso (DEMO)!`, 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            // Cross-turma duplicate check
            const turmasToCheck = ALL_TURMAS.filter(t => t !== selectedTurma);
            for (const turma of turmasToCheck) {
                const collectionName = getTurmaCollectionName(turma);
                const collRef = collection(db, collectionName);

                const matriculaQuery = query(collRef, where("matricula", "==", matricula));
                const nameQuery = query(collRef, where("name", "==", finalName));

                const [matriculaSnapshot, nameSnapshot] = await Promise.all([
                    getDocs(matriculaQuery),
                    getDocs(nameQuery)
                ]);

                const foundDoc = matriculaSnapshot.docs[0] || nameSnapshot.docs[0];

                if (foundDoc) {
                    setExistingUserInfo({ name: foundDoc.data().name, turma: TURMA_DISPLAY_NAMES[turma] || turma });
                    setActiveModal(ModalType.UserExistsWarning);
                    return; // Stop execution
                }
            }

            // If no duplicate is found, proceed to add the user
            const collectionName = getTurmaCollectionName(selectedTurma);
            await addDoc(collection(db, collectionName), {
                name: finalName,
                matricula,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
                turno: '7H'
            });

            if (!addAnother) {
                setActiveModal(ModalType.None);
            }
            showNotification(`Usuário ${finalName} adicionado com sucesso!`, 'success');
            logAuditEvent(adminEmail, 'ADD_USER', `Novo funcionário: ${finalName} (Matrícula: ${matricula}) na Turma ${TURMA_DISPLAY_NAMES[selectedTurma]}`, selectedTurma);
        } catch (error) {
            console.error("Error adding user:", error);
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro.';
            showNotification(`Falha ao adicionar usuário: ${errorMessage}`, 'error');
        }
    };

    const handleClearData = async () => {
        if (!isAdmin || !selectedTurma) {
            showNotification('Apenas administradores podem limpar os dados.', 'error');
            return;
        }

        if (isDemoMode) {
            setEmployees(prev => prev.map(e => ({
                ...e,
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null
            })));
            setMainSubject('');
            setMainMatricula('');
            setMainResponsible('');
            setSpecialSubject('');
            setSpecialMatricula('');
            setSpecialResponsible('');
            setActiveModal(ModalType.None);
            showNotification('Dados limpos com sucesso (DEMO)!', 'success');
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        try {
            const batch = writeBatch(db);
            const collectionName = getTurmaCollectionName(selectedTurma);
            const employeesSnapshot = await getDocs(collection(db, collectionName));
            employeesSnapshot.forEach((doc) => {
                batch.update(doc.ref, {
                    assDss: false,
                    bem: false,
                    mal: false,
                    absent: false,
                    time: null,
                });
            });

            const registrationCollectionName = getTurmaRegistrationName(selectedTurma);
            const registrationsSnapshot = await getDocs(collection(db, registrationCollectionName));
            registrationsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            setActiveModal(ModalType.None);
            showNotification('Dados de status diário e registros manuais foram limpos!', 'success');
            logAuditEvent(adminEmail, 'CLEAR_DATA', `Dados diários limpos da Turma ${TURMA_DISPLAY_NAMES[selectedTurma]}`, selectedTurma);
        } catch (error) {
            console.error("Error clearing data:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao limpar dados: ${message}`, 'error');
        }
    };

    const handleReorganize = () => {
        setEmployees(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
        setActiveModal(ModalType.None);
        showNotification('Painel reorganizado alfabeticamente!', 'success');
    };

    const handleImportEmployee = async (employeeId: string, sourceTurma: TurmaType) => {
        if (!isAdmin || !selectedTurma) {
            showNotification('Ação não permitida.', 'error');
            return;
        }
        if (sourceTurma === selectedTurma) {
            showNotification('A turma de origem deve ser diferente da atual.', 'error');
            return;
        }

        if (isDemoMode) {
            const employeeToMove = { id: `demo-moved-${Date.now()}`, name: "Funcionário Importado", matricula: "0000", turno: "7H", time: null, assDss: false, bem: false, mal: false, absent: false };
            setEmployees(prev => [...prev, employeeToMove].sort((a, b) => a.name.localeCompare(b.name)));
            showNotification(`${employeeToMove.name} importado para a Turma ${TURMA_DISPLAY_NAMES[selectedTurma]} (DEMO).`, 'success');
            setActiveModal(ModalType.None);
            return;
        }

        if (!db) {
            showNotification("A conexão com o banco de dados não está disponível.", "error");
            return;
        }

        const sourceCollectionName = getTurmaCollectionName(sourceTurma);
        const destinationCollectionName = getTurmaCollectionName(selectedTurma);
        const sourceDocRef = doc(db, sourceCollectionName, employeeId);

        try {
            const docSnap = await getDoc(sourceDocRef);
            if (!docSnap.exists()) {
                throw new Error("Documento do funcionário não foi encontrado na turma de origem.");
            }

            const employeeData = docSnap.data();
            const employeeName = employeeData.name || 'O colaborador';

            // Limpa o status diário ao importar, mantendo apenas os dados essenciais.
            const cleanedEmployeeData = {
                name: employeeData.name,
                matricula: employeeData.matricula,
                turno: '7H', // Define o turno padrão para a nova turma
                assDss: false,
                bem: false,
                mal: false,
                absent: false,
                time: null,
            };

            const batch = writeBatch(db);

            const newDocRef = doc(collection(db, destinationCollectionName));
            batch.set(newDocRef, cleanedEmployeeData);

            batch.delete(sourceDocRef);

            await batch.commit();

            showNotification(`${employeeName} foi importado para a Turma ${TURMA_DISPLAY_NAMES[selectedTurma]} com sucesso!`, 'success');
            logAuditEvent(adminEmail, 'IMPORT_USER', `Funcionário: ${employeeName} importado da Turma ${TURMA_DISPLAY_NAMES[sourceTurma]} para Turma ${TURMA_DISPLAY_NAMES[selectedTurma]}`, selectedTurma);
            setActiveModal(ModalType.None);

        } catch (error) {
            console.error("Error importing employee:", error);
            const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showNotification(`Falha ao importar funcionário: ${message}`, 'error');
        }
    };

    const handleSelectTurma = useCallback((turma: TurmaType) => {
        localStorage.setItem('selectedTurma', turma);
        setLoading(true);
        setEmployees([]); // Limpa dados antigos para evitar exibir dados da turma errada
        setSelectedTurma(turma);
    }, []);

    const handleSelectLayout = useCallback((layout: 'standard' | 'custom') => {
        localStorage.setItem('selectedLayout', layout);
        setSelectedLayout(layout);
    }, []);

    const handleReturnToSelection = useCallback(() => {
        localStorage.removeItem('selectedTurma');
        localStorage.removeItem('selectedLayout');
        setSelectedLayout(null);
        setSelectedTurma(null);
        setEmployees([]);
        setIsAdmin(false);
        isDemoModeRef.current = false;
        setIsDemoMode(false);
    }, []);

    const handleHelpClick = useCallback(() => {
        // Não removemos mais as flags aqui para evitar loops de tutorial ao recarregar
        setActiveModal(ModalType.TutorialChoice);
    }, []);

    const stats = useMemo(() => ({
        bem: employees.filter(e => e.bem).length,
        mal: employees.filter(e => e.mal).length,
        absent: employees.filter(e => e.absent).length,
        pendente: employees.filter(e => !e.bem && !e.assDss && !e.mal && !e.absent).length,
        total: employees.length,
    }), [employees]);

    const mainTeam = useMemo(() => employees.filter(e => e.turno !== '6H').sort((a, b) => a.name.localeCompare(b.name)), [employees]);
    const specialTeam = useMemo(() => employees.filter(e => e.turno === '6H').sort((a, b) => a.name.localeCompare(b.name)), [employees]);

    const groupedMainTeam = useMemo(() => {
        const groups: { letter: string; employees: Employee[] }[] = [];

        mainTeam.forEach(emp => {
            const firstLetter = emp.name.charAt(0).toUpperCase();

            // Allow letters A-Z, otherwise group under '#'
            const groupLetter = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#';

            let group = groups.find(g => g.letter === groupLetter);
            if (!group) {
                group = { letter: groupLetter, employees: [] };
                groups.push(group);
            }
            group.employees.push(emp);
        });

        // Sort letters just to be absolutely sure (A-Z, then #)
        groups.sort((a, b) => {
            if (a.letter === '#') return 1;
            if (b.letter === '#') return -1;
            return a.letter.localeCompare(b.letter);
        });

        return groups;
    }, [mainTeam]);

    // Tracking vertical scroll percentage of the main viewport 
    // to map to the vertical scroll percentage of the fast scroller bar itself.

    useEffect(() => {
        if (selectedLayout !== 'custom' || groupedMainTeam.length === 0) return;

        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleScroll = () => {
            const barElement = document.getElementById('fast-scroller-bar');
            if (!barElement) return;

            // Calculate how far we've scrolled down the main viewport as a percentage (0 to 1)
            const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
            if (maxScrollTop <= 0) return;

            const scrollPercentage = viewport.scrollTop / maxScrollTop;

            // Apply that same percentage to the fast scroller bar
            const maxBarScrollTop = barElement.scrollHeight - barElement.clientHeight;
            if (maxBarScrollTop > 0) {
                // Sincroniza a rolagem da barra lateral proporcionalmente
                barElement.scrollTop = maxBarScrollTop * Math.min(Math.max(scrollPercentage, 0), 1);
            }

            // Detectar a letra ativa
            if (groupedMainTeam.length > 0) {
                const viewportRect = viewport.getBoundingClientRect();
                const viewportTop = viewportRect.top;
                let currentActive = groupedMainTeam[0].letter;

                // Margem a partir do topo para ativar a próxima letra
                const THRESHOLD = viewportTop + 200;

                for (const group of groupedMainTeam) {
                    const el = document.getElementById(`letter-group-${group.letter}`);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (rect.top <= THRESHOLD) {
                            currentActive = group.letter;
                        } else {
                            break;
                        }
                    }
                }
                setActiveLetter(currentActive);
            }
        };

        viewport.addEventListener('scroll', handleScroll, { passive: true });
        // Initial sync just in case
        handleScroll();

        return () => viewport.removeEventListener('scroll', handleScroll);
    }, [selectedLayout, groupedMainTeam]);

    const handleFastScroll = (letter: string) => {
        if (!viewportRef.current) return;

        const barElement = document.getElementById('fast-scroller-bar');
        const groupElement = document.getElementById(`letter-group-${letter}`);

        if (groupElement) {
            const viewportRect = viewportRef.current.getBoundingClientRect();
            const groupRect = groupElement.getBoundingClientRect();

            // Pegar a escala nativa contida no state do app (usada para o Zoom Pinch)
            const scale = scaleStateRef.current.currentScale;

            // Se tivermos a barra lateral, calculamos o centro dela para alinhar o cartão
            let targetVisualOffset = 80 * scale; // Fallback para logo abaixo do header

            if (barElement) {
                const barRect = barElement.getBoundingClientRect();
                const barCenterY = barRect.top - viewportRect.top + (barRect.height / 2);

                // Tentamos pegar o primeiro card dentro do grupo para centralizar por ele, não pela label da letra
                const firstCard = groupElement.querySelector('.card-optimized') || groupElement.querySelector('div[class*="w-[870px]"]');
                const cardHeight = firstCard ? firstCard.getBoundingClientRect().height : 300 * scale;

                // Alinhamos o topo do grupo de forma que o centro do primeiro card 
                // bata com o centro vertical da barra de letras
                // Mas precisamos compensar o título do grupo (que tem aprox 80px)
                const groupTitleHeight = 80 * scale;
                targetVisualOffset = barCenterY - (cardHeight / 2) - groupTitleHeight;
            }

            // Distância visual atual entre o topo do elemento e o topo visível do viewport de rolagem
            const currentRelativeToViewport = groupRect.top - viewportRect.top;

            // Quanto pixels de scroll ainda precisamos para empurrar a borda superior do grupo
            // até a posição do `targetVisualOffset`
            const scrollAmount = currentRelativeToViewport - targetVisualOffset;

            const targetScrollTop = viewportRef.current.scrollTop + scrollAmount;

            viewportRef.current.scrollTo({
                top: targetScrollTop,
                left: 0,
                behavior: 'smooth'
            });

            // Força o comportamento natural de scroll se ele clicar
        }
    };


    const getPendingEmployeeName = () => {
        return employees.find(e => e.id === pendingEmployeeId)?.name || 'Colaborador';
    };

    const getPendingEmployeeTurno = () => {
        const current = employees.find(e => e.id === pendingEmployeeId)?.turno;
        return current === '6H' ? getMainShiftLabel(selectedTurma) : getShiftLabel(selectedTurma);
    };

    const handleTutorialStepChange = (step: TutorialStep) => {
        const isMobile = window.innerWidth < 1024;
        if (!isMobile) return;

        let targetIdForZoom = step.targetId;

        if (step.targetId === 'tutorial-card-actions' || step.targetId === 'tutorial-card-time') {
            targetIdForZoom = 'tutorial-first-card';
        }

        if (step.targetId === 'tutorial-return-turn-btn' ||
            ['tutorial-stats', 'tutorial-dark-mode', 'tutorial-admin-btn', 'tutorial-change-turma-btn', 'tutorial-help-btn'].includes(step.targetId)) {
            // Se for Turma CCG, não existe tutorial-special-demo-area, então focalizamos na área do header principal ou na primeira carta
            targetIdForZoom = selectedTurma === 'CCG' ? 'app-header' : 'tutorial-special-demo-area';
        }

        const element = document.getElementById(targetIdForZoom);
        if (!element) return;

        const margin = 32;
        const availableWidth = window.innerWidth - margin;
        const elementWidth = element.offsetWidth;

        if (elementWidth > 0) {
            let newScale = availableWidth / elementWidth;
            newScale = Math.min(Math.max(newScale, 0.3), 1.1);
            setScale(newScale);
        }
    }

    // Callbacks estáveis para evitar re-renders de componentes com React.memo
    // IMPORTANTE: Hooks devem ficar ANTES de qualquer return condicional (Regra dos Hooks do React)
    const handleOpenAdminLogin = useCallback(() => setActiveModal(ModalType.AdminLogin), []);
    const handleCloseModal = useCallback(() => setActiveModal(ModalType.None), []);
    const handleBackToAdminOptions = useCallback(() => setActiveModal(ModalType.AdminOptions), []);
    const handleOpenAddUser = useCallback(() => setActiveModal(ModalType.AddUser), []);
    const handleOpenReport = useCallback(() => setActiveModal(ModalType.Report), []);
    const handleOpenImportEmployee = useCallback(() => setActiveModal(ModalType.ImportEmployee), []);
    const handleOpenDemoPassword = useCallback(() => setActiveModal(ModalType.DemoPassword), []);
    const handleStartAdminTutorial = useCallback(() => setIsAdminTutorialOpen(true), []);
    const handleRegister7H = useCallback((subject: string, matricula: string) => handleManualRegister('7H', matricula, subject), [handleManualRegister]);
    const handleRegister6H = useCallback((subject: string, matricula: string) => handleManualRegister('6H', matricula, subject), [handleManualRegister]);

    const handleDeclineBiometrics = useCallback(() => {
        setActiveModal(ModalType.AdminOptions);
    }, []);

    const handleActivateBiometrics = useCallback(async () => {
        try {
            if (!adminEmailRef.current) return;
            const success = await registerBiometricAdmin(adminEmailRef.current);
            if (success) {
                showNotification('Acesso por impressão digital ativado com sucesso!', 'success');
            }
        } catch (error) {
            console.error("Falha ao registrar biometria:", error);
            showNotification('Não foi possível registrar a digital neste aparelho.', 'error');
        } finally {
            setActiveModal(ModalType.AdminOptions);
        }
    }, [showNotification]);

    const handleToggleAutomation = useCallback(() => {
        setActiveModal(ModalType.AutomationPassword);
    }, []);

    const handleConfirmAutomationPassword = async (password: string) => {
        if (!selectedTurma || !db) return;
        
        if (password !== 'Near2203@') {
            showNotification('Senha incorreta para pausar ações.', 'error');
            return;
        }

        try {
            const configRef = doc(db, 'configuracoes', 'automacao');
            const snap = await getDoc(configRef);
            if (snap.exists()) {
                await updateDoc(configRef, { [selectedTurma]: !isAutomationPaused });
            } else {
                await setDoc(configRef, { [selectedTurma]: !isAutomationPaused });
            }
            showNotification(`Ações ${isAutomationPaused ? 'reativadas' : 'pausadas'} para a Turma ${selectedTurma}.`, 'success');
            setActiveModal(ModalType.None);
        } catch (e) {
            console.error(e);
            showNotification('Erro ao pausar as ações. Verifique permissões.', 'error');
        }
    };

    const currentLiveHistory = useMemo(() => {
        if (!selectedTurma) return null;
        
        const today = new Date();
        const dataISO = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        const dataFormatted = String(today.getDate()).padStart(2, '0') + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + today.getFullYear();
        
        const r: HistoryEmployee[] = employees.map(emp => {
            let s: HistoryStatus = 'PEN';
            if (emp.mal) s = 'MAL';
            else if (emp.absent) s = 'AUS';
            else if (emp.assDss && emp.bem) s = 'BEM';
            return {
                m: emp.matricula,
                n: emp.name,
                s,
                t: emp.time,
                turno: emp.turno
            };
        });

        const record: HistoryRecord = {
            data: dataFormatted,
            dataISO: dataISO,
            turma: selectedTurma,
            registros7H: mainSubject || mainResponsible ? [{ assunto: mainSubject, name: mainResponsible || '', matricula: mainMatricula }] : [],
            registros6H: specialSubject || specialResponsible ? [{ assunto: specialSubject, name: specialResponsible || '', matricula: specialMatricula }] : [],
            r,
            totalFuncionarios: stats.total,
            totalPresentes: stats.bem,
            totalAusentes: stats.absent,
            totalMal: stats.mal,
            totalPendentes: stats.pendente
        };
        return record;
    }, [selectedTurma, employees, mainSubject, mainResponsible, mainMatricula, specialSubject, specialResponsible, specialMatricula, stats]);

    const handleThemeContinue = useCallback(() => {
        localStorage.setItem('themeSelected', 'true');
        setHasSelectedTheme(true);
    }, []);

    if (!hasSelectedTheme) {
        return (
            <ThemeSelectionScreen 
                isDarkMode={isDarkMode} 
                onToggleDarkMode={handleToggleDarkMode} 
                onContinue={handleThemeContinue} 
            />
        );
    }

    if (!selectedTurma) {
        return (
            <TurmaSelectionScreen
                onSelect={handleSelectTurma}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
            />
        );
    }

    if (!selectedLayout) {
        return (
            <LayoutSelectionScreen
                onSelect={handleSelectLayout}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onBack={handleReturnToSelection}
                selecionadaTurma={selectedTurma}
            />
        );
    }

    return (
        <div className="bg-light-bg-secondary dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text transition-colors relative overflow-hidden">



            <div ref={viewportRef} className={`viewport fixed inset-0 bg-light-bg-secondary dark:bg-dark-bg`}>
                <div ref={contentWrapperRef} className="origin-top-left">
                    <div ref={scalableContainerRef} className="scalable-container w-fit origin-top-left p-8 bg-light-bg-secondary dark:bg-dark-bg pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
                        <Header
                            stats={stats}
                            loading={loading}
                            onAdminClick={handleOpenAdminLogin}
                            onHelpClick={handleHelpClick}
                            isDarkMode={isDarkMode}
                            onToggleDarkMode={handleToggleDarkMode}
                            turma={selectedTurma}
                            onReturnToSelection={handleReturnToSelection}
                        />

                        {isDemoMode && (
                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-bold shadow-md z-10 animate-pulse pointer-events-none">
                                MODO DEMONSTRAÇÃO ATIVO
                            </div>
                        )}

                        <div className="flex gap-8 flex-nowrap relative">
                            <div className="flex flex-col gap-8 shrink-0 min-h-screen relative">
                                {selectedTurma !== 'ESTAGIO' && (
                                    <ManualRegisterSection
                                        subject={mainSubject}
                                        matricula={mainMatricula}
                                        onRegister={handleRegister7H}
                                        employeesForLookup={allEmployeesForLookup}
                                        administrators={administrators}
                                        turma={selectedTurma}
                                    />
                                )}

                                <div className="flex gap-6 pr-12 relative w-fit">
                                    <div className="flex flex-col gap-8 w-fit shrink-0 relative pb-[50vh]">
                                        {/* RENDERIZAÇÃO BASEADA NO LAYOUT SELECIONADO */}
                                        {selectedLayout === 'standard' ? (
                                            <div className="flex flex-wrap gap-[24px] w-max max-w-[2660px]">
                                                {mainTeam.map((emp, index) => (
                                                    <div key={emp.id} className="w-[870px]">
                                                        <EmployeeCard
                                                            employee={emp}
                                                            onStatusChange={handleStatusChange}
                                                            onToggleSpecialTeam={handleToggleSpecialTeam}
                                                            isTogglingSpecialTeam={togglingSpecialTeamId === emp.id}
                                                            isAdmin={isAdmin}
                                                            onDelete={handleDeleteUser}
                                                            onTimeChange={handleTimeUpdate}
                                                            onMatriculaChange={handleMatriculaUpdate}
                                                            domId={index === 0 ? "tutorial-first-card" : undefined}
                                                            hideShiftButton={selectedTurma === 'CCG' || selectedTurma === 'ESTAGIO' || !is6HActive}
                                                            shiftLabel={getShiftLabel(selectedTurma)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* RENDERIZAÇÃO LAYOUT 'CUSTOM' (ALFABÉTICO) */
                                            groupedMainTeam.map((group) => (
                                                <div key={group.letter} id={`letter-group-${group.letter}`} className="flex flex-col w-fit mb-4">
                                                    <div className="bg-light-card dark:bg-dark-card backdrop-blur-md py-4 px-6 mb-6 border-2 border-primary/20 flex items-center gap-6 shadow-md rounded-2xl w-full">
                                                        <div className="w-14 h-14 bg-primary text-white rounded-xl flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
                                                            {group.letter}
                                                        </div>
                                                        <span className="text-light-text-secondary dark:text-dark-text-secondary opacity-80 text-2xl font-medium ml-auto">
                                                            {group.employees.length} {group.employees.length === 1 ? 'colaborador' : 'colaboradores'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-[24px] w-max max-w-[2660px]">
                                                        {group.employees.map((emp, index) => (
                                                            <div key={emp.id} className="w-[870px]">
                                                                <EmployeeCard
                                                                    employee={emp}
                                                                    onStatusChange={handleStatusChange}
                                                                    onToggleSpecialTeam={handleToggleSpecialTeam}
                                                                    isTogglingSpecialTeam={togglingSpecialTeamId === emp.id}
                                                                    isAdmin={isAdmin}
                                                                    onDelete={handleDeleteUser}
                                                                    onTimeChange={handleTimeUpdate}
                                                                    onMatriculaChange={handleMatriculaUpdate}
                                                                    domId={index === 0 && group.letter === groupedMainTeam[0]?.letter ? "tutorial-first-card" : undefined}
                                                                    hideShiftButton={selectedTurma === 'CCG' || selectedTurma === 'ESTAGIO' || !is6HActive}
                                                                    shiftLabel={getShiftLabel(selectedTurma)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {mainTeam.length === 0 && (
                                            <div className="w-full text-center py-20 text-light-text-secondary dark:text-dark-text-secondary text-xl font-medium">
                                                {loading ? (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
                                                        <span>Carregando colaboradores...</span>
                                                    </div>
                                                ) : (
                                                    <>Nenhum colaborador encontrado na Turma {selectedTurma}.</>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* ALPHABETICAL FAST SCROLLER (Somente no layout custom) */}
                                    {selectedLayout === 'custom' && (
                                        <div
                                            id="fast-scroller-bar"
                                            className="sticky top-[100px] h-fit max-h-[80vh] flex flex-col gap-1 z-10 p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20 dark:border-white/5 ml-4 self-start overflow-y-auto hide-scrollbar"
                                            onTouchStart={(e) => e.stopPropagation()}
                                            onTouchMove={(e) => e.stopPropagation()}
                                            onWheel={(e) => e.stopPropagation()}
                                        >
                                            {groupedMainTeam.map(group => (
                                                <div
                                                    key={`nav-${group.letter}`}
                                                    id={`nav-letter-${group.letter}`}
                                                    onClick={() => handleFastScroll(group.letter)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-all shadow-sm flex-shrink-0 ${activeLetter === group.letter
                                                        ? 'bg-primary text-white scale-110 shadow-md ring-2 ring-primary/30'
                                                        : 'bg-transparent text-light-text-secondary dark:text-dark-text-secondary hover:bg-primary/20 hover:text-primary dark:hover:text-primary-light'
                                                        }`}
                                                >
                                                    {group.letter}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                            {selectedTurma !== 'CCG' && selectedTurma !== 'ESTAGIO' && is6HActive && (
                                <SpecialTeamPanel
                                    specialTeam={specialTeam}
                                    onStatusChange={handleStatusChange}
                                    onToggleSpecialTeam={handleToggleSpecialTeam}
                                    togglingSpecialTeamId={togglingSpecialTeamId}
                                    isAdmin={isAdmin}
                                    onDeleteUser={handleDeleteUser}
                                    onTimeChange={handleTimeUpdate}
                                    onMatriculaUpdate={handleMatriculaUpdate}
                                    subject={specialSubject}
                                    matricula={specialMatricula}
                                    onRegister={handleRegister6H}
                                    employeesForLookup={allEmployeesForLookup}
                                    administrators={administrators}
                                    turma={selectedTurma}
                                />
                            )}
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>

            <AdminLoginModal
                isOpen={activeModal === ModalType.AdminLogin}
                onClose={handleCloseModal}
                onLogin={handleAdminLogin}
                showNotification={showNotification}
                scale={modalScale}
            />
            <ConfirmBiometricModal
                isOpen={activeModal === ModalType.ConfirmBiometric}
                onClose={handleDeclineBiometrics}
                onActivate={handleActivateBiometrics}
                scale={modalScale}
            />
                            <AdminOptionsModal
                                isOpen={activeModal === ModalType.AdminOptions}
                                onClose={handleCloseModal}
                                onClear={handleClearData}
                                onReorganize={handleReorganize}
                                onAddUser={handleOpenAddUser}
                                onSendReport={handleOpenReport}
                                onImportUser={handleOpenImportEmployee}
                                onEnterDemo={handleOpenDemoPassword}
                                onStartAdminTutorial={handleStartAdminTutorial}
                                onToggle6H={handleToggle6H}
                                onToggleAutomation={handleToggleAutomation}
                                onHistory={() => setActiveModal(ModalType.HistoryView)}
                                onClearBiometrics={() => {
                                    clearBiometricData();
                                    showNotification('Acesso por impressão digital desativado neste aparelho.', 'success');
                                    setActiveModal(ModalType.None);
                                }}
                                hasBiometrics={hasRegisteredBiometrics()}
                                is6HActive={is6HActive}
                                isAutomationPaused={isAutomationPaused}
                                scale={modalScale}
                                selectedTurma={selectedTurma}
                            />
            <DemoPasswordModal
                isOpen={activeModal === ModalType.DemoPassword}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDemoPassword}
                scale={modalScale}
            />
            <AutomationPasswordModal
                isOpen={activeModal === ModalType.AutomationPassword}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAutomationPassword}
                scale={modalScale}
            />
            <AddUserModal isOpen={activeModal === ModalType.AddUser} onClose={handleCloseModal} onBack={handleBackToAdminOptions} onAdd={handleAddUser} scale={modalScale} />
            <ReportModal
                isOpen={activeModal === ModalType.Report}
                onClose={handleCloseModal}
                onBack={handleBackToAdminOptions}
                employees={employees}
                showNotification={showNotification}
                scale={modalScale}
                subject7H={mainSubject}
                responsible7H={mainResponsible}
                matricula7H={mainMatricula}
                subject6H={specialSubject}
                responsible6H={specialResponsible}
                matricula6H={specialMatricula}
                adminEmail={adminEmail}
                turma={selectedTurma}
            />

            <HistoryModal
                isOpen={activeModal === ModalType.HistoryView}
                onClose={handleCloseModal}
                onBack={handleBackToAdminOptions}
                scale={modalScale}
                turma={selectedTurma}
                showNotification={showNotification}
                currentLiveHistory={currentLiveHistory}
                adminEmail={adminEmail}
                administrators={administrators}
            />

            <ImportEmployeeModal
                isOpen={activeModal === ModalType.ImportEmployee}
                onClose={handleCloseModal}
                onBack={handleBackToAdminOptions}
                onImport={handleImportEmployee}
                currentTurma={selectedTurma}
                scale={modalScale}
                showNotification={showNotification}
            />
            <UserExistsWarningModal
                isOpen={activeModal === ModalType.UserExistsWarning}
                onClose={handleCloseModal}
                onImportClick={() => setActiveModal(ModalType.ImportEmployee)}
                existingUserInfo={existingUserInfo}
                scale={modalScale}
            />

            <InteractiveTutorial
                isOpen={activeModal === ModalType.Tutorial}
                onClose={handleCloseModal}
                steps={getTutorialSteps(selectedTurma)}
                scale={modalScale}
                onStepChange={handleTutorialStepChange}
            />

            <InteractiveTutorial
                isOpen={isAdminTutorialOpen}
                onClose={() => setIsAdminTutorialOpen(false)}
                steps={adminTutorialSteps}
                scale={modalScale}
                onStepChange={handleTutorialStepChange}
            />

            <InvalidMatriculaModal
                isOpen={activeModal === ModalType.InvalidMatricula}
                onClose={() => setActiveModal(ModalType.None)}
                scale={modalScale}
            />

            <ConfirmMalModal
                isOpen={activeModal === ModalType.ConfirmMal}
                onClose={() => { setPendingEmployeeId(null); setActiveModal(ModalType.None); }}
                onConfirm={handleConfirmMal}
                scale={modalScale}
            />

            <ConfirmTurnoModal
                isOpen={activeModal === ModalType.ConfirmTurno}
                onClose={() => { setPendingEmployeeId(null); setActiveModal(ModalType.None); }}
                onConfirm={handleConfirmTurno}
                employeeName={getPendingEmployeeName()}
                targetTurno={getPendingEmployeeTurno()}
                scale={modalScale}
            />

            <ConfirmAbsentModal
                isOpen={activeModal === ModalType.ConfirmAbsent}
                onClose={() => { setPendingEmployeeId(null); setActiveModal(ModalType.None); }}
                onConfirm={handleConfirmAbsent}
                employeeName={getPendingEmployeeName()}
                scale={modalScale}
            />

            <ConfirmDeleteModal
                isOpen={activeModal === ModalType.ConfirmDelete}
                onClose={() => { setPendingEmployeeId(null); setActiveModal(ModalType.None); }}
                onConfirm={handleConfirmDelete}
                employeeName={getPendingEmployeeName()}
                scale={modalScale}
            />

            <ConfirmDeactivate6HModal
                isOpen={activeModal === ModalType.ConfirmDeactivate6H}
                onClose={() => setActiveModal(ModalType.None)}
                onConfirm={handleConfirmDeactivate6H}
                selectedTurma={selectedTurma}
                scale={modalScale}
            />

            <TutorialChoiceModal
                isOpen={activeModal === ModalType.TutorialChoice}
                onClose={() => setActiveModal(ModalType.None)}
                onSelectInteractive={() => setActiveModal(ModalType.Tutorial)}
                onSelectVideo={() => setActiveModal(ModalType.TutorialVideo)}
                scale={modalScale}
            />

            <TutorialVideoModal
                isOpen={activeModal === ModalType.TutorialVideo}
                onClose={() => setActiveModal(ModalType.None)}
                scale={modalScale}
            />

            <div
                className="fixed z-[100] space-y-3 top-[calc(1.25rem+env(safe-area-inset-top))] right-[calc(1.25rem+env(safe-area-inset-right))]"
                style={{ transform: `scale(${modalScale})`, transformOrigin: 'top right' }}
            >
                {notifications.map(n => <Notification key={n.id} notification={n} onDismiss={dismissNotification} />)}
            </div>
        </div>
    );
};

export default App;
