// Simple bold parser
function renderBoldText(text) {
    if (!text) return "";
    if (!text.includes("**")) return text;
    const parts = text.split("**");
    return parts.map((part, index) => {
        return index % 2 === 1 ? <strong key={index} style={{ fontWeight: "800", color: "var(--primary)" }}>{part}</strong> : part;
    });
}

// Custom Premium Markdown Renderer Component for study schedules
function MarkdownRenderer({ text }) {
    if (!text) return null;
    const lines = text.split("\n");
    return (
        <div style={{ fontFamily: "inherit", color: "var(--text-main)", fontSize: "14px", lineHeight: "1.6" }}>
            {lines.map((line, idx) => {
                let trimmed = line.trim();
                
                if (trimmed.startsWith("# ")) {
                    return <h1 key={idx} style={{ fontSize: "22px", fontWeight: "800", marginTop: "20px", marginBottom: "10px", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>{trimmed.slice(2)}</h1>;
                }
                if (trimmed.startsWith("## ")) {
                    return <h2 key={idx} style={{ fontSize: "18px", fontWeight: "800", marginTop: "18px", marginBottom: "8px", color: "var(--text-main)" }}>{trimmed.slice(3)}</h2>;
                }
                if (trimmed.startsWith("### ")) {
                    return <h3 key={idx} style={{ fontSize: "15px", fontWeight: "800", marginTop: "16px", marginBottom: "6px", color: "var(--text-main)" }}>{trimmed.slice(4)}</h3>;
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    return (
                        <li key={idx} style={{ marginLeft: "20px", marginBottom: "6px", listStyleType: "disc" }}>
                            {renderBoldText(trimmed.slice(2))}
                        </li>
                    );
                }
                if (trimmed.startsWith("> ")) {
                    return (
                        <blockquote key={idx} style={{ 
                            borderLeft: "4px solid var(--primary)", 
                            background: "var(--primary-light)", 
                            padding: "10px 15px", 
                            margin: "15px 0", 
                            borderRadius: "0 8px 8px 0",
                            fontStyle: "italic",
                            fontSize: "13px"
                        }}>
                            {renderBoldText(trimmed.slice(2))}
                        </blockquote>
                    );
                }
                if (trimmed === "") {
                    return <div key={idx} style={{ height: "8px" }} />;
                }
                return (
                    <p key={idx} style={{ margin: "4px 0 6px 0" }}>
                        {renderBoldText(line)}
                    </p>
                );
            })}
        </div>
    );
}

function App() {
    const API = "";
    // Helper to format Date as YYYY-MM-DD
    const getTodayDateStr = () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    
    const getPresentTime12 = () => {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        let ampm = "AM";
        if (h >= 12) {
            ampm = "PM";
            if (h > 12) h -= 12;
        }
        if (h === 0) h = 12;
        return {
            hour: h.toString().padStart(2, '0'),
            minute: m,
            ampm: ampm
        };
    };

    const getOneHourLaterTime12 = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        let ampm = "AM";
        if (h >= 12) {
            ampm = "PM";
            if (h > 12) h -= 12;
        }
        if (h === 0) h = 12;
        return {
            hour: h.toString().padStart(2, '0'),
            minute: m,
            ampm: ampm
        };
    };

    // State variables
    const [isLoggedIn, setIsLoggedIn] = React.useState(() => {
        return localStorage.getItem("isLoggedIn") === "true";
    });
    const [view, setView] = React.useState(() => {
        return localStorage.getItem("isLoggedIn") === "true" ? "dashboard" : "landing";
    });
    const [fullName, setFullName] = React.useState("");
    const [email, setEmail] = React.useState(() => {
        return localStorage.getItem("email") || "";
    });
    const [signupEmail, setSignupEmail] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [authError, setAuthError] = React.useState("");
    const [showAuth, setShowAuth] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState(() => {
        return localStorage.getItem("activeTab") || "dashboard";
    });
    const [toasts, setToasts] = React.useState([]);
    const [newPassword, setNewPassword] = React.useState("");
    const [activeTheme, setActiveTheme] = React.useState(() => {
        return localStorage.getItem("activeTheme") || "light";
    });
    const [authMode, setAuthMode] = React.useState("login"); // 'login', 'signup', or 'forgot_password'
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [otpSent, setOtpSent] = React.useState(false);
    const [otpVerified, setOtpVerified] = React.useState(false);
    const [otpPurpose, setOtpPurpose] = React.useState("signup"); // 'signup' or 'forgot_password'
    const [forgotEmail, setForgotEmail] = React.useState("");
    const [currentUser, setCurrentUser] = React.useState(() => {
        return localStorage.getItem("currentUser") || "";
    });
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [events, setEvents] = React.useState([]);
    const [assignments, setAssignments] = React.useState([]);
    const [currentMonth, setCurrentMonth] = React.useState(() => new Date());
    const [selectedCalendarDate, setSelectedCalendarDate] = React.useState(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    });

    // Google Profile detail states
    const [dob, setDob] = React.useState(() => {
        return localStorage.getItem("dob") || "";
    });
    const [gender, setGender] = React.useState(() => {
        return localStorage.getItem("gender") || "";
    });
    const [age, setAge] = React.useState(() => {
        return localStorage.getItem("age") || "";
    });
    const [googleConnected, setGoogleConnected] = React.useState(() => {
        return localStorage.getItem("googleConnected") === "true";
    });

    // App Usage Streak Tracker
    const [appUsageStreak, setAppUsageStreak] = React.useState(() => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
        const lastOpen = localStorage.getItem("lastOpenDate");
        let currentStreak = parseInt(localStorage.getItem("appUsageStreak") || "0");

        // Update App Usage Map counts for today
        const usageMap = JSON.parse(localStorage.getItem("appUsageMap") || "{}");
        usageMap[todayStr] = (usageMap[todayStr] || 0) + 1;
        localStorage.setItem("appUsageMap", JSON.stringify(usageMap));

        if (!lastOpen) {
            currentStreak = 1;
            localStorage.setItem("lastOpenDate", todayStr);
            localStorage.setItem("appUsageStreak", "1");
        } else {
            const today = new Date(todayStr + "T00:00:00");
            const last = new Date(lastOpen + "T00:00:00");
            const diffTime = Math.abs(today - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak += 1;
                localStorage.setItem("lastOpenDate", todayStr);
                localStorage.setItem("appUsageStreak", String(currentStreak));
            } else if (diffDays > 1) {
                currentStreak = 1;
                localStorage.setItem("lastOpenDate", todayStr);
                localStorage.setItem("appUsageStreak", "1");
            } else {
                if (currentStreak === 0) currentStreak = 1;
            }
        }
        return currentStreak;
    });

    // Form states - Events
    const [eventName, setEventName] = React.useState("");
    const [eventDate, setEventDate] = React.useState(getTodayDateStr);
    const [priority, setPriority] = React.useState("Medium");
    const [showPriorityDropdown, setShowPriorityDropdown] = React.useState(false);
    const [reminderUnit, setReminderUnit] = React.useState("1");
    const [showReminderUnitDropdown, setShowReminderUnitDropdown] = React.useState(false);
    const priorityRef = React.useRef(null);
    const reminderUnitRef = React.useRef(null);
    const [eventDescription, setEventDescription] = React.useState("");
    const [eventColor, setEventColor] = React.useState("Default colour");
    const [eventCategory, setEventCategory] = React.useState("General");
    
    // 12-Hour picker states
    const [startTimeHour, setStartTimeHour] = React.useState(() => getPresentTime12().hour);
    const [startTimeMinute, setStartTimeMinute] = React.useState(() => getPresentTime12().minute);
    const [startTimeAmPm, setStartTimeAmPm] = React.useState(() => getPresentTime12().ampm);
    const [showStartTimePicker, setShowStartTimePicker] = React.useState(false);

    const [endTimeHour, setEndTimeHour] = React.useState(() => getOneHourLaterTime12().hour);
    const [endTimeMinute, setEndTimeMinute] = React.useState(() => getOneHourLaterTime12().minute);
    const [endTimeAmPm, setEndTimeAmPm] = React.useState(() => getOneHourLaterTime12().ampm);
    const [showEndTimePicker, setShowEndTimePicker] = React.useState(false);
    const [eventLoading, setEventLoading] = React.useState(false);

    // Custom Date Picker states
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [pickerMonth, setPickerMonth] = React.useState(() => new Date().getMonth());
    const [pickerYear, setPickerYear] = React.useState(() => new Date().getFullYear());
    const [faqOpenIndex, setFaqOpenIndex] = React.useState(null);
    
    const [selectedReminders, setSelectedReminders] = React.useState([]);
    const [editingEventId, setEditingEventId] = React.useState(null);
    const [editingGoogleEventId, setEditingGoogleEventId] = React.useState(null);
    const triggeredAlertsRef = React.useRef({});
    const chatEndRef = React.useRef(null);
    const eventCategoriesChartRef = React.useRef(null);
    const eventPriorityChartRef = React.useRef(null);
    const assignmentUrgencyChartRef = React.useRef(null);
    const goalProgressChartRef = React.useRef(null);
    const chartInstancesRef = React.useRef({
        eventCategories: null,
        eventPriority: null,
        assignmentUrgency: null,
        goalProgress: null
    });

    // Time conversion helpers
    const convert12to24 = (h, m, ampm) => {
        let hr = parseInt(h);
        if (ampm === "PM" && hr < 12) hr += 12;
        if (ampm === "AM" && hr === 12) hr = 0;
        const hrStr = hr.toString().padStart(2, '0');
        const minStr = m.toString().padStart(2, '0');
        return `${hrStr}:${minStr}`;
    };

    const convert24to12 = (time24) => {
        if (!time24) return { hour: "09", minute: "00", ampm: "AM" };
        const [hStr, mStr] = time24.split(":");
        let h = parseInt(hStr);
        let ampm = "AM";
        if (h >= 12) {
            ampm = "PM";
            if (h > 12) h -= 12;
        }
        if (h === 0) h = 12;
        return {
            hour: h.toString().padStart(2, '0'),
            minute: mStr,
            ampm: ampm
        };
    };


    // Form states - Assignments
    const [assignName, setAssignName] = React.useState("");
    const [assignSubject, setAssignSubject] = React.useState("");
    const [assignDeadline, setAssignDeadline] = React.useState("");
    const [editingAssignId, setEditingAssignId] = React.useState(null);
    const [showAssignDatePicker, setShowAssignDatePicker] = React.useState(false);
    const [assignPickerMonth, setAssignPickerMonth] = React.useState(() => new Date().getMonth());
    const [assignPickerYear, setAssignPickerYear] = React.useState(() => new Date().getFullYear());

    // AI states
    const [aiQuestion, setAiQuestion] = React.useState("");
    const [aiReply, setAiReply] = React.useState("Ask me about your free time, upcoming events, or deadlines!");
    const [aiLoading, setAiLoading] = React.useState(false);
    const [chatMessages, setChatMessages] = React.useState([]);
    const [chatSessions, setChatSessions] = React.useState(() => {
        try {
            const stored = localStorage.getItem("smartTimetableChatSessions");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [currentSessionId, setCurrentSessionId] = React.useState(null);

    React.useEffect(() => {
        if (currentSessionId && chatMessages.length > 0) {
            setChatSessions(prev => {
                const sessionIndex = prev.findIndex(s => s.id === currentSessionId);
                if (sessionIndex >= 0) {
                    const newSessions = [...prev];
                    let title = newSessions[sessionIndex].title;
                    if (title === "New Chat") {
                        const firstUserMsg = chatMessages.find(m => m.sender === "user");
                        if (firstUserMsg) {
                            title = firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? "..." : "");
                        }
                    }
                    newSessions[sessionIndex] = {
                        ...newSessions[sessionIndex],
                        title: title,
                        messages: chatMessages,
                        lastUpdated: Date.now()
                    };
                    localStorage.setItem("smartTimetableChatSessions", JSON.stringify(newSessions));
                    return newSessions;
                }
                return prev;
            });
        }
    }, [chatMessages, currentSessionId]);

    // AI Scheduler states
    const [scheduleDuration, setScheduleDuration] = React.useState(7);
    const [scheduleStudyHours, setScheduleStudyHours] = React.useState(4);
    const [scheduleType, setScheduleType] = React.useState("Balanced Study Plan");
    const [scheduleIntensity, setScheduleIntensity] = React.useState("Moderate");
    const [schedulerLoading, setSchedulerLoading] = React.useState(false);
    const [generatedSchedule, setGeneratedSchedule] = React.useState("");
    const [showScheduleTypeDropdown, setShowScheduleTypeDropdown] = React.useState(false);
    const [showScheduleIntensityDropdown, setShowScheduleIntensityDropdown] = React.useState(false);

    const [activeContextMenuId, setActiveContextMenuId] = React.useState(null);
    const [activeContextMenuType, setActiveContextMenuType] = React.useState(null);
    
    // Global click listener to close popups when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.custom-select-container')) {
                setShowScheduleTypeDropdown(false);
                setShowScheduleIntensityDropdown(false);
                setShowAiEngineDropdown(false);
                setShowAiModelDropdown(false);
            }
            if (!e.target.closest('.context-menu-popup') && !e.target.closest('.assign-menu-popover') && !e.target.closest('.event-card') && !e.target.closest('.assignment-card')) {
                setActiveContextMenuId(null);
                setActiveContextMenuType(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    
    // Advanced AI Engine settings
    const [aiEngine, setAiEngine] = React.useState(() => localStorage.getItem("aiEngine") || "keyword");
    const [aiModel, setAiModel] = React.useState(() => localStorage.getItem("aiModel") || "");
    const [openrouterKey, setOpenrouterKey] = React.useState(() => localStorage.getItem("openrouterKey") || "");
    const [huggingfaceToken, setHuggingfaceToken] = React.useState(() => localStorage.getItem("huggingfaceToken") || "");
    const [ollamaModels, setOllamaModels] = React.useState([]);
    const [ollamaConnected, setOllamaConnected] = React.useState(false);
    const [showAiSettings, setShowAiSettings] = React.useState(false);
    const [aiSidebarCollapsed, setAiSidebarCollapsed] = React.useState(false);
    const [showAiEngineDropdown, setShowAiEngineDropdown] = React.useState(false);
    const [showAiModelDropdown, setShowAiModelDropdown] = React.useState(false);
    const [usageDurationMap, setUsageDurationMap] = React.useState(() => {
        return JSON.parse(localStorage.getItem("appUsageDurationMap") || "{}");
    });
    const [showPastEvents, setShowPastEvents] = React.useState(false);
    const [analyticsData, setAnalyticsData] = React.useState(null);
    const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

    const renderAIHighlight = React.useCallback((text) => {
        if (!text) return "";
        const parts = text.split(/(AI)/);
        return parts.map((part, index) => {
            if (part === "AI") {
                const className = activeTheme === "dark" ? "ai-highlight-dark" : "ai-highlight-light";
                return <span key={index} className={className}>{part}</span>;
            }
            return part;
        });
    }, [activeTheme]);

    // Helper to determine if an event is active (not yet completed)
    const isEventActive = React.useCallback((event) => {
        if (!event.date) return false;
        try {
            const endStr = event.end || "23:59";
            const eventEnd = new Date(`${event.date}T${endStr}`);
            return eventEnd >= new Date();
        } catch (e) {
            return true;
        }
    }, []);

    // Helper to check if a date is within the active app usage streak
    const isDateInStreak = React.useCallback((dateStr) => {
        if (!appUsageStreak || appUsageStreak <= 0) return false;
        const today = new Date();
        for (let i = 0; i < appUsageStreak; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const formatted = `${y}-${m}-${day}`;
            if (formatted === dateStr) {
                return true;
            }
        }
        return false;
    }, [appUsageStreak]);

    // Helper to check if a date is within 35 days in the past or is in the future (unlocked to support all history)
    const isDateWithin35Days = React.useCallback((dateStr) => {
        if (!dateStr) return false;
        try {
            const dateVal = new Date(dateStr + "T00:00:00");
            if (isNaN(dateVal.getTime())) return false;
            return true; // Unlocked unlimited history access!
        } catch (e) {
            return true;
        }
    }, []);

    // Helper to check if an event is completed (end time is in the past)
    const isEventCompleted = React.useCallback((event) => {
        if (!event.date) return false;
        try {
            const endStr = event.end || "23:59";
            const eventEnd = new Date(`${event.date}T${endStr}`);
            return eventEnd < new Date();
        } catch (e) {
            return false;
        }
    }, []);

    // Premium Toast Notification Helper
    const showToast = React.useCallback((message, type = "success") => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    // Dynamic Database-Synced Preference Helpers
    const fetchUserProfile = async (userEmail) => {
        if (!userEmail) return;
        try {
            const res = await fetch(`${API}/api/user/profile?username=${encodeURIComponent(userEmail)}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data.name || "");
                setEmail(data.email || "");
                setDob(data.dob || "N/A");
                setGender(data.gender || "N/A");
                setAge(data.age || "N/A");
                setGoogleConnected(data.googleConnected);
                
                // Hydrate cloud AI settings
                if (data.aiEngine) {
                    setAiEngine(data.aiEngine);
                    localStorage.setItem("aiEngine", data.aiEngine);
                }
                if (data.aiModel) {
                    setAiModel(data.aiModel);
                    localStorage.setItem("aiModel", data.aiModel);
                }
                if (data.openrouterKey) {
                    setOpenrouterKey(data.openrouterKey);
                    localStorage.setItem("openrouterKey", data.openrouterKey);
                }
                if (data.huggingfaceToken) {
                    setHuggingfaceToken(data.huggingfaceToken);
                    localStorage.setItem("huggingfaceToken", data.huggingfaceToken);
                }

                // Apply cloud theme immediately
                if (data.theme) {
                    setActiveTheme(data.theme);
                    localStorage.setItem("activeTheme", data.theme);
                    if (data.theme === "dark") {
                        document.documentElement.classList.add("dark-theme");
                    } else {
                        document.documentElement.classList.remove("dark-theme");
                    }
                }
                
                // Apply cloud active view tab
                if (data.activeTab) {
                    setActiveTab(data.activeTab);
                    localStorage.setItem("activeTab", data.activeTab);
                }
            }
        } catch (err) {
            console.error("Cloud profile load failed:", err);
        }
    };

    const saveUserSettings = async (newTheme, newTab) => {
        const userEmail = email || localStorage.getItem("email");
        if (!userEmail) return;
        
        const payload = { username: userEmail };
        if (newTheme !== undefined) payload.theme = newTheme;
        if (newTab !== undefined) payload.activeTab = newTab;
        
        try {
            await fetch(`${API}/api/user/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Cloud preferences save failed:", err);
        }
    };

    const saveAiSettings = async (engine, model, orKey, hfToken) => {
        const userEmail = email || localStorage.getItem("email");
        if (!userEmail) return;
        
        try {
            const res = await fetch(`${API}/api/user/ai-settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: userEmail,
                    aiEngine: engine,
                    aiModel: model,
                    openrouterKey: orKey,
                    huggingfaceToken: hfToken
                })
            });
            if (res.ok) {
                showToast("AI preferences synced to your account!", "success");
            }
        } catch (err) {
            console.error("AI settings save failed:", err);
            showToast("Saved AI settings locally", "success");
        }
    };

    const handleTabSwitch = (tabName) => {
        setActiveTab(tabName);
        localStorage.setItem("activeTab", tabName);
        saveUserSettings(undefined, tabName);
        // Only auto-collapse the sidebar on mobile view to close the slide-out menu drawer
        if (window.innerWidth <= 768) {
            setSidebarCollapsed(true);
        }
    };

    // Unified Header Navigation Shortcuts helper with active select styling
    const renderHeaderNavigation = React.useCallback((currentTab) => {
        const getButtonStyles = (isActive) => ({
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: "8px", 
            borderRadius: "12px", 
            background: isActive ? "var(--primary-light)" : "var(--surface)", 
            border: isActive ? "2px solid var(--primary)" : "1.5px solid var(--border)", 
            boxShadow: isActive ? "0 0 12px rgba(139, 92, 246, 0.25)" : "var(--shadow-sm)", 
            cursor: "pointer", 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            color: isActive ? "var(--primary)" : "var(--text-main)"
        });

        const handleMouseOver = (e, isActive) => {
            e.currentTarget.style.transform = "scale(1.08) translateY(-1px)";
            e.currentTarget.style.boxShadow = isActive ? "0 0 15px rgba(139, 92, 246, 0.35)" : "var(--shadow-md)";
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.background = isActive ? "var(--primary-light)" : "#ffffff";
        };

        const handleMouseOut = (e, isActive) => {
            e.currentTarget.style.transform = "scale(1) translateY(0)";
            e.currentTarget.style.boxShadow = isActive ? "0 0 12px rgba(139, 92, 246, 0.25)" : "var(--shadow-sm)";
            e.currentTarget.style.borderColor = isActive ? "var(--primary)" : "var(--border)";
            e.currentTarget.style.background = isActive ? "var(--primary-light)" : "var(--surface)";
        };

        return (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* Home/Dashboard shortcut button */}
                <button
                    onClick={() => handleTabSwitch("dashboard")}
                    title="Go to Dashboard"
                    style={getButtonStyles(currentTab === "dashboard")}
                    onMouseOver={(e) => handleMouseOver(e, currentTab === "dashboard")}
                    onMouseOut={(e) => handleMouseOut(e, currentTab === "dashboard")}
                >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>

                {/* AI Assistant shortcut button */}
                <button
                    onClick={() => handleTabSwitch("ai")}
                    title="Ask AI Assistant"
                    style={getButtonStyles(currentTab === "ai")}
                    onMouseOver={(e) => handleMouseOver(e, currentTab === "ai")}
                    onMouseOut={(e) => handleMouseOut(e, currentTab === "ai")}
                >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="url(#aiIconGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <defs>
                            <linearGradient id="aiIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                {activeTheme === "dark" ? (
                                    <>
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="100%" stopColor="#818cf8" />
                                    </>
                                ) : (
                                    <>
                                        <stop offset="0%" stopColor="#ec4899" />
                                        <stop offset="100%" stopColor="#f43f5e" />
                                    </>
                                )}
                            </linearGradient>
                        </defs>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                </button>

                {/* AI Scheduler shortcut button */}
                <button
                    onClick={() => handleTabSwitch("ai-scheduler")}
                    title="AI Study Scheduler"
                    style={getButtonStyles(currentTab === "ai-scheduler")}
                    onMouseOver={(e) => handleMouseOver(e, currentTab === "ai-scheduler")}
                    onMouseOut={(e) => handleMouseOut(e, currentTab === "ai-scheduler")}
                >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                </button>

                {/* Schedule shortcut button */}
                <button
                    onClick={() => handleTabSwitch("schedule")}
                    title="View Schedule"
                    style={getButtonStyles(currentTab === "schedule")}
                    onMouseOver={(e) => handleMouseOver(e, currentTab === "schedule")}
                    onMouseOut={(e) => handleMouseOut(e, currentTab === "schedule")}
                >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </button>


                
                {/* Google Calendar button */}
                <a 
                    href={googleConnected && email ? `https://calendar.google.com/calendar/r?authuser=${encodeURIComponent(email)}` : "https://calendar.google.com/calendar/r"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Navigate to Google Calendar"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px",
                        borderRadius: "12px",
                        background: "var(--surface)",
                        border: "1.5px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        color: "var(--text-main)"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "scale(1.08) translateY(-1px)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                        e.currentTarget.style.borderColor = "#4285F4";
                        e.currentTarget.style.background = "#ffffff";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "var(--surface)";
                    }}
                >
                    <svg viewBox="0 0 48 48" width="19" height="19" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                        <path fill="#4285F4" d="M38 44H10c-3.3 0-6-2.7-6-6V10c0-3.3 2.7-6 6-6h28c3.3 0 6 2.7 6 6v28c0 3.3-2.7 6-6 6z"/>
                        <path fill="#FFF" d="M10 12h28v26H10z"/>
                        <path fill="#4285F4" d="M38 4H10c-3.3 0-6 2.7-6 6v2H44v-2c0-3.3-2.7-6-6-6z"/>
                        <text x="24" y="32" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="22" fill="#4285F4" text-anchor="middle">31</text>
                    </svg>
                </a>
            </div>
        );
    }, [activeTheme, googleConnected, email]);

    // Custom Dropdowns Click-Outside Handlers
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (priorityRef.current && !priorityRef.current.contains(event.target)) {
                setShowPriorityDropdown(false);
            }
            if (reminderUnitRef.current && !reminderUnitRef.current.contains(event.target)) {
                setShowReminderUnitDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Reset auth inputs when toggling modes
    React.useEffect(() => {
        setFullName("");
        setSignupEmail("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setAuthError("");
        setOtp("");
        setOtpSent(false);
        setOtpVerified(false);
        setForgotEmail("");
    }, [authMode, showAuth]);

    // Check URL parameters for successful Google authentication callback
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("login_success") === "true") {
            const nameParam = params.get("name") || "";
            const emailParam = params.get("email") || "";
            const dobParam = params.get("dob") || "N/A";
            const genderParam = params.get("gender") || "N/A";
            const ageParam = params.get("age") || "N/A";
            
            setIsLoggedIn(true);
            setCurrentUser(nameParam);
            setEmail(emailParam);
            setDob(dobParam);
            setGender(genderParam);
            setAge(ageParam);
            setGoogleConnected(true);
            setView("dashboard");

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", nameParam);
            localStorage.setItem("email", emailParam);
            localStorage.setItem("dob", dobParam);
            localStorage.setItem("gender", genderParam);
            localStorage.setItem("age", ageParam);
            localStorage.setItem("googleConnected", "true");
            
            // Trigger database settings sync load immediately
            fetchUserProfile(emailParam);
            showToast("Google login successful! Welcome to your workspace.", "success");
            
            // Clean up the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.has("login_success") || params.has("error")) {
            const error = params.get("error");
            if (error === "no_account") {
                setAuthError("No account created. Please sign up first.");
                setAuthMode("signup");
                setShowAuth(true);
                showToast("No account found with this Google email. Please sign up first.", "error");
            } else {
                showToast("Authentication failed.", "error");
            }
            // Clean up address bar for failed logins or error query parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Initialize theme from localStorage/cloud on mount
    React.useEffect(() => {
        const storedTheme = localStorage.getItem("activeTheme") || "light";
        if (storedTheme === "dark") {
            document.documentElement.classList.add("dark-theme");
        } else {
            document.documentElement.classList.remove("dark-theme");
        }
    }, []);

    // Coerce deprecated activeTab settings to unified settings
    React.useEffect(() => {
        if (activeTab === "appearance" || activeTab === "security") {
            setActiveTab("settings");
            localStorage.setItem("activeTab", "settings");
        }
    }, [activeTab]);

    // Load data and fetch cloud settings profile when user logs in/changes
    React.useEffect(() => {
        if (isLoggedIn) {
            const userEmail = email || localStorage.getItem("email");
            if (userEmail) {
                fetchUserProfile(userEmail);
            }
            loadEvents();
            loadAssignments();
        }
    }, [isLoggedIn, email]);

    // Verify Ollama connection status dynamically
    React.useEffect(() => {
        if (!isLoggedIn) return;
        
        const checkOllama = async () => {
            try {
                const res = await fetch(`${API}/api/ai/ollama-models`);
                if (res.ok) {
                    const data = await res.json();
                    setOllamaConnected(data.connected);
                    if (data.connected && data.models) {
                        setOllamaModels(data.models);
                        // Default to first model if current model is empty
                        const storedModel = localStorage.getItem("aiModel");
                        if (!aiModel && !storedModel && data.models.length > 0) {
                            setAiModel(data.models[0]);
                            localStorage.setItem("aiModel", data.models[0]);
                        }
                    }
                } else {
                    setOllamaConnected(false);
                }
            } catch (err) {
                setOllamaConnected(false);
            }
        };

        if (isLoggedIn && (activeTab === "ai" || aiEngine === "ollama")) {
            checkOllama();
            const interval = setInterval(checkOllama, 10000); // Check every 10 seconds
            return () => clearInterval(interval);
        }
    }, [isLoggedIn, activeTab, aiEngine, aiModel]);

    // Background interval for alerts (checks every 10 seconds, runs immediately on mount)
    React.useEffect(() => {
        if (isLoggedIn) {
            checkNotifications();
            const interval = setInterval(checkNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn, email]);

    // Precision Visibility Timer to track active usage time (updates usageDurationMap real-time)
    React.useEffect(() => {
        if (!isLoggedIn) return;
        
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                const todayStr = new Date().toLocaleDateString('en-CA');
                setUsageDurationMap(prev => {
                    const nextMap = { ...prev };
                    nextMap[todayStr] = (nextMap[todayStr] || 0) + 10; // add 10 seconds
                    localStorage.setItem("appUsageDurationMap", JSON.stringify(nextMap));
                    return nextMap;
                });
            }
        }, 10000); // 10-second high-efficiency tick
        
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    // Automatic bottom scrolling side effect for the AI chat panel
    React.useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    // Analytics data fetcher
    const fetchAnalyticsData = async () => {
        const user = email || currentUser || "admin";
        setAnalyticsLoading(true);
        try {
            const res = await fetch(`${API}/api/analytics/data?username=${encodeURIComponent(user)}`);
            if (res.ok) {
                const data = await res.json();
                setAnalyticsData(data);
            } else {
                showToast("Failed to load analytics data", "error");
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
            showToast("Error connecting to analytics endpoint", "error");
        } finally {
            setAnalyticsLoading(false);
        }
    };

    React.useEffect(() => {
        if (isLoggedIn && activeTab === "analytics") {
            fetchAnalyticsData();
        }
    }, [isLoggedIn, activeTab, events, assignments]);

    // Chart.js render engine
    React.useEffect(() => {
        if (activeTab !== "analytics" || !analyticsData || !window.Chart) return;

        // Helper to destroy previous chart instances
        const destroyChart = (key) => {
            if (chartInstancesRef.current[key]) {
                chartInstancesRef.current[key].destroy();
                chartInstancesRef.current[key] = null;
            }
        };

        // 1. Event Categories Pie Chart
        if (eventCategoriesChartRef.current) {
            destroyChart("eventCategories");
            const ctx = eventCategoriesChartRef.current.getContext("2d");
            const categories = analyticsData.eventCategories || {};
            const labels = Object.keys(categories);
            const dataValues = Object.values(categories);
            
            if (labels.length === 0) {
                labels.push("No Events");
                dataValues.push(1);
            }

            chartInstancesRef.current["eventCategories"] = new window.Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: [
                            "#6366f1", "#a855f7", "#ec4899", "#f43f5e", 
                            "#10b981", "#3b82f6", "#f59e0b", "#14b8a6",
                            "#64748b", "#84cc16", "#06b6d4", "#e11d48"
                        ],
                        borderWidth: activeTheme === "dark" ? 2 : 1,
                        borderColor: activeTheme === "dark" ? "#1e1e30" : "#ffffff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: activeTheme === "dark" ? "#e2e8f0" : "#1e293b",
                                font: { family: "Inter, system-ui, sans-serif", size: 11 }
                            }
                        }
                    }
                }
            });
        }

        // 2. Event Priority Bar Chart
        if (eventPriorityChartRef.current) {
            destroyChart("eventPriority");
            const ctx = eventPriorityChartRef.current.getContext("2d");
            const priorities = analyticsData.eventPriorities || { High: 0, Medium: 0, Low: 0 };
            
            chartInstancesRef.current["eventPriority"] = new window.Chart(ctx, {
                type: "bar",
                data: {
                    labels: ["High", "Medium", "Low"],
                    datasets: [{
                        label: "Events count",
                        data: [priorities.High || 0, priorities.Medium || 0, priorities.Low || 0],
                        backgroundColor: ["#ef4444", "#8b5cf6", "#10b981"],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: activeTheme === "dark" ? "#94a3b8" : "#64748b",
                                font: { family: "Inter, system-ui, sans-serif" }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: activeTheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                            },
                            ticks: {
                                stepSize: 1,
                                color: activeTheme === "dark" ? "#94a3b8" : "#64748b",
                                font: { family: "Inter, system-ui, sans-serif" }
                            }
                        }
                    }
                }
            });
        }

        // 3. Assignment Urgency Doughnut Chart
        if (assignmentUrgencyChartRef.current) {
            destroyChart("assignmentUrgency");
            const ctx = assignmentUrgencyChartRef.current.getContext("2d");
            const urgency = analyticsData.assignmentUrgency || { High: 0, Medium: 0, Low: 0 };
            const labels = ["High", "Medium", "Low"];
            const dataValues = [urgency.High || 0, urgency.Medium || 0, urgency.Low || 0];

            chartInstancesRef.current["assignmentUrgency"] = new window.Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: ["#f43f5e", "#fbbf24", "#34d399"],
                        borderWidth: activeTheme === "dark" ? 2 : 1,
                        borderColor: activeTheme === "dark" ? "#1e1e30" : "#ffffff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: activeTheme === "dark" ? "#e2e8f0" : "#1e293b",
                                font: { family: "Inter, system-ui, sans-serif", size: 11 }
                            }
                        }
                    },
                    cutout: "60%"
                }
            });
        }

        // 4. Goal Completion Progress Chart
        if (goalProgressChartRef.current) {
            destroyChart("goalProgress");
            const ctx = goalProgressChartRef.current.getContext("2d");
            const goalsList = analyticsData.goals || [];
            
            const labels = goalsList.map(g => g.goal.length > 20 ? g.goal.substring(0, 20) + "..." : g.goal);
            const progressData = goalsList.map(g => g.progress);
            
            if (labels.length === 0) {
                labels.push("No Active Goals");
                progressData.push(0);
            }

            chartInstancesRef.current["goalProgress"] = new window.Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Progress %",
                        data: progressData,
                        backgroundColor: "#a855f7",
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            min: 0,
                            max: 100,
                            grid: {
                                color: activeTheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                            },
                            ticks: {
                                color: activeTheme === "dark" ? "#94a3b8" : "#64748b",
                                font: { family: "Inter, system-ui, sans-serif" }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                color: activeTheme === "dark" ? "#94a3b8" : "#64748b",
                                font: { family: "Inter, system-ui, sans-serif" }
                            }
                        }
                    }
                }
            });
        }

        // Clean up charts on unmount
        return () => {
            destroyChart("eventCategories");
            destroyChart("eventPriority");
            destroyChart("assignmentUrgency");
            destroyChart("goalProgress");
        };
    }, [activeTab, analyticsData, activeTheme]);

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError("");
        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (authMode === "login") {
            if (!trimmedUser || !trimmedPass) {
                setAuthError("Please enter both Username/Email and Password!");
                return;
            }
            try {
                const response = await fetch(`${API}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: trimmedUser,
                        password: trimmedPass
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    setIsLoggedIn(true);
                    setCurrentUser(data.user.name || data.user.username);
                    setEmail(data.user.email || "");
                    setDob(data.user.dob || "N/A");
                    setGender(data.user.gender || "N/A");
                    setAge(data.user.age || "N/A");
                    setGoogleConnected(false);
                    
                    // Sync active theme and tab from database preference response
                    const userTheme = data.user.theme || "light";
                    const userTab = data.user.activeTab || "dashboard";
                    setActiveTheme(userTheme);
                    setActiveTab(userTab);
                    localStorage.setItem("activeTab", userTab);
                    if (userTheme === "dark") {
                        document.documentElement.classList.add("dark-theme");
                    } else {
                        document.documentElement.classList.remove("dark-theme");
                    }

                    setView("dashboard");
                    setShowAuth(false);

                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("currentUser", data.user.name || data.user.username);
                    localStorage.setItem("email", data.user.email || "");
                    localStorage.setItem("dob", data.user.dob || "N/A");
                    localStorage.setItem("gender", data.user.gender || "N/A");
                    localStorage.setItem("age", data.user.age || "N/A");
                    localStorage.setItem("googleConnected", "false");
                    localStorage.setItem("activeTheme", userTheme);
                    
                    if (data.message === "Your account is created!") {
                        showToast("Your account is created!", "success");
                    } else {
                        showToast("Login successful! Welcome back.", "success");
                    }
                } else {
                    setAuthError(data.message || "Authentication failed.");
                }
            } catch (err) {
                console.error("Login connection error:", err);
                setAuthError("Failed to connect to backend server. Please make sure Flask is running.");
            }
        } else {
            // Sign Up: validate Full Name, Email, Password, and Confirm Password
            const trimmedName = fullName.trim();
            const trimmedEmail = signupEmail.trim();
            const trimmedPass = password.trim();

            if (!trimmedName) {
                setAuthError("Please enter your Full Name to register!");
                return;
            }
            if (!trimmedEmail) {
                setAuthError("Please enter your Email Address to register!");
                return;
            }
            if (!trimmedPass) {
                setAuthError("Please enter a password to register!");
                return;
            }
            if (trimmedPass !== confirmPassword.trim()) {
                setAuthError("Passwords do not match! Please confirm your password again.");
                return;
            }
            
            try {
                const response = await fetch(`${API}/api/send-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: trimmedEmail,
                        purpose: "signup"
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    setOtpSent(true);
                    setOtpPurpose("signup");
                    setOtp("");
                    setAuthError("");
                    showToast("Verification code sent to your email!", "success");
                } else {
                    setAuthError(data.message || "Failed to send verification code.");
                }
            } catch (err) {
                console.error("Signup send OTP connection error:", err);
                setAuthError("Failed to connect to backend server. Please make sure Flask is running.");
            }
        }
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setAuthError("");
        const trimmedEmail = signupEmail.trim();
        const trimmedName = fullName.trim();
        const trimmedPass = password.trim();
        const trimmedOtp = otp.trim();
        
        if (!trimmedOtp) {
            setAuthError("Please enter the 4-digit verification code!");
            return;
        }
        
        try {
            const verifyRes = await fetch(`${API}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: trimmedEmail,
                    otp: trimmedOtp,
                    purpose: "signup"
                })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
                setAuthError(verifyData.message || "OTP verification failed.");
                return;
            }
            
            const signupRes = await fetch(`${API}/api/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: trimmedEmail,
                    fullName: trimmedName,
                    email: trimmedEmail,
                    password: trimmedPass
                })
            });
            
            const signupData = await signupRes.json();
            if (signupRes.ok) {
                setIsLoggedIn(true);
                setCurrentUser(signupData.user.name || signupData.user.username);
                setEmail(signupData.user.email || "");
                setDob(signupData.user.dob || "N/A");
                setGender(signupData.user.gender || "N/A");
                setAge(signupData.user.age || "N/A");
                setGoogleConnected(false);
                
                const userTheme = signupData.user.theme || "light";
                const userTab = signupData.user.activeTab || "dashboard";
                setActiveTheme(userTheme);
                setActiveTab(userTab);
                localStorage.setItem("activeTab", userTab);
                if (userTheme === "dark") {
                    document.documentElement.classList.add("dark-theme");
                } else {
                    document.documentElement.classList.remove("dark-theme");
                }

                setView("dashboard");
                setShowAuth(false);
                setOtpSent(false);

                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("currentUser", signupData.user.name || signupData.user.username);
                localStorage.setItem("email", signupData.user.email || "");
                localStorage.setItem("dob", signupData.user.dob || "N/A");
                localStorage.setItem("gender", signupData.user.gender || "N/A");
                localStorage.setItem("age", signupData.user.age || "N/A");
                localStorage.setItem("googleConnected", "false");
                localStorage.setItem("activeTheme", userTheme);
                showToast("Your account is created!", "success");
            } else {
                setAuthError(signupData.message || "Registration failed.");
            }
        } catch (err) {
            console.error("Verification/Registration error:", err);
            setAuthError("Failed to complete registration. Please try again.");
        }
    };

    const handleSendForgotOtp = async (e) => {
        e.preventDefault();
        setAuthError("");
        const trimmedEmail = forgotEmail.trim();
        if (!trimmedEmail) {
            setAuthError("Please enter your Email Address!");
            return;
        }
        try {
            const res = await fetch(`${API}/api/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail, purpose: "forgot_password" })
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setOtpPurpose("forgot_password");
                setOtpVerified(false);
                setOtp("");
                setAuthError("");
                showToast("Verification code sent to your email!", "success");
            } else {
                setAuthError(data.message || "Failed to send code.");
            }
        } catch (err) {
            console.error("Forgot OTP send error:", err);
            setAuthError("Connection error. Failed to send verification code.");
        }
    };

    const handleVerifyForgotOtp = async (e) => {
        e.preventDefault();
        setAuthError("");
        const trimmedEmail = forgotEmail.trim();
        const trimmedOtp = otp.trim();
        
        if (!trimmedOtp) {
            setAuthError("Please enter the 4-digit verification code!");
            return;
        }
        
        try {
            const verifyRes = await fetch(`${API}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: trimmedEmail,
                    otp: trimmedOtp,
                    purpose: "forgot_password"
                })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
                setOtpVerified(true);
                setAuthError("");
                showToast("Code verified! Please enter your new password.", "success");
            } else {
                setAuthError(verifyData.message || "OTP verification failed.");
            }
        } catch (err) {
            console.error("Forgot OTP verification error:", err);
            setAuthError("Connection error. Failed to verify OTP code.");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setAuthError("");
        const trimmedEmail = forgotEmail.trim();
        const trimmedOtp = otp.trim();
        const trimmedPass = password.trim();
        const trimmedConfirm = confirmPassword.trim();
        
        if (!trimmedPass) {
            setAuthError("Please enter a new password!");
            return;
        }
        if (trimmedPass !== trimmedConfirm) {
            setAuthError("Passwords do not match!");
            return;
        }
        
        try {
            const resetRes = await fetch(`${API}/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: trimmedEmail,
                    otp: trimmedOtp,
                    password: trimmedPass
                })
            });
            
            const resetData = await resetRes.json();
            if (resetRes.ok) {
                setIsLoggedIn(true);
                setCurrentUser(resetData.user.name || resetData.user.username);
                setEmail(resetData.user.email || "");
                setDob(resetData.user.dob || "N/A");
                setGender(resetData.user.gender || "N/A");
                setAge(resetData.user.age || "N/A");
                setGoogleConnected(false);
                
                const userTheme = resetData.user.theme || "light";
                const userTab = resetData.user.activeTab || "dashboard";
                setActiveTheme(userTheme);
                setActiveTab(userTab);
                localStorage.setItem("activeTab", userTab);
                if (userTheme === "dark") {
                    document.documentElement.classList.add("dark-theme");
                } else {
                    document.documentElement.classList.remove("dark-theme");
                }

                setView("dashboard");
                setShowAuth(false);
                setOtpSent(false);
                setOtpVerified(false);
                setForgotEmail("");
                
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("currentUser", resetData.user.name || resetData.user.username);
                localStorage.setItem("email", resetData.user.email || "");
                localStorage.setItem("dob", resetData.user.dob || "N/A");
                localStorage.setItem("gender", resetData.user.gender || "N/A");
                localStorage.setItem("age", resetData.user.age || "N/A");
                localStorage.setItem("googleConnected", "false");
                localStorage.setItem("activeTheme", userTheme);
                showToast("Password reset successfully! Welcome back.", "success");
            } else {
                setAuthError(resetData.message || "Password reset failed.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setAuthError("Failed to reset password. Please try again.");
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser("");
        setEmail("");
        setDob("");
        setGender("");
        setAge("");
        setGoogleConnected(false);
        setView("landing");
        setUsername("");
        setPassword("");
        setActiveTab("dashboard");
        setActiveTheme("light");
        document.documentElement.classList.remove("dark-theme");

        const keys = ["isLoggedIn", "currentUser", "email", "dob", "gender", "age", "googleConnected", "activeTheme", "activeTab"];
        keys.forEach(k => localStorage.removeItem(k));
        showToast("Logout successful. See you soon!", "success");
    };

    // settings handlers
    const handleApplyTheme = (themeName) => {
        setActiveTheme(themeName);
        localStorage.setItem("activeTheme", themeName);
        if (themeName === "dark") {
            document.documentElement.classList.add("dark-theme");
        } else {
            document.documentElement.classList.remove("dark-theme");
        }
        saveUserSettings(themeName, undefined);
    };

    const handleSettingsResetPassword = (e) => {
        e.preventDefault();
        const trimmedNewPass = newPassword.trim();
        if (!trimmedNewPass) {
            showToast("Please enter a valid new password!", "warning");
            return;
        }
        setPassword(trimmedNewPass);
        setNewPassword("");
        showToast("Password reset successfully! Your workspace security credentials have been updated.", "success");
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you absolutely sure you want to delete your workspace account? This will wipe your profile and all scheduled calendar data permanently.")) {
            setEvents([]);
            setAssignments([]);
            setIsLoggedIn(false);
            setCurrentUser("");
            setEmail("");
            setDob("");
            setGender("");
            setAge("");
            setGoogleConnected(false);
            setView("landing");
            setFullName("");
            setUsername("");
            setPassword("");

            const keys = ["isLoggedIn", "currentUser", "email", "dob", "gender", "age", "googleConnected"];
            keys.forEach(k => localStorage.removeItem(k));
            
            showToast("Workspace account and calendar databases successfully purged. Returning to landing page.", "success");
        }
    };

    // -----------------------------------
    // API INTEGRATION FUNCTIONS
    // -----------------------------------

    async function loadEvents() {
        const user = email || currentUser || "admin";
        try {
            const res = await fetch(`${API}/events?username=${encodeURIComponent(user)}`);
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events:", error);
        }
    }

    async function loadAssignments() {
        const user = email || currentUser || "admin";
        try {
            const res = await fetch(`${API}/assignments?username=${encodeURIComponent(user)}`);
            const data = await res.json();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to load assignments:", error);
        }
    }

    async function handleDeleteEvent(event) {
        if (!window.confirm(`Are you sure you want to delete "${event.name}"?`)) {
            return;
        }
        try {
            const user = email || currentUser || "admin";
            const res = await fetch(`${API}/deleteEvent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user,
                    id: event.id,
                    google_event_id: event.google_event_id
                })
            });
            const data = await res.json();
            showToast(data.message, res.ok ? "success" : "error");
            loadEvents();
        } catch (error) {
            console.error("Delete event failed:", error);
            showToast("Failed to connect to backend", "error");
        }
    }

    function handleOpenEditModal(event) {
        setEditingEventId(event.id || null);
        setEditingGoogleEventId(event.google_event_id || null);
        setEventName(event.name || "");
        setEventDate(event.date || "");
        
        // Parse 24-hour time to 12-hour states
        const startParsed = convert24to12(event.start);
        setStartTimeHour(startParsed.hour);
        setStartTimeMinute(startParsed.minute);
        setStartTimeAmPm(startParsed.ampm);

        const endParsed = convert24to12(event.end);
        setEndTimeHour(endParsed.hour);
        setEndTimeMinute(endParsed.minute);
        setEndTimeAmPm(endParsed.ampm);

        setPriority(event.priority || "Medium");
        setEventCategory(event.category || "General");
        setEventDescription(event.description || "");
        setEventColor(event.color || "Default colour");
        setSelectedReminders(event.reminders || []);
        setActiveTab("schedule");
        showToast("Event loaded into Schedule editor.", "info");
    }


    async function handleEventSubmit(e) {
        e.preventDefault();
        
        // Construct 24-hour times
        const computedStart = convert12to24(startTimeHour, startTimeMinute, startTimeAmPm);
        const computedEnd = convert12to24(endTimeHour, endTimeMinute, endTimeAmPm);

        if (!eventName || !eventDate) {
            showToast("Please fill in all event details", "warning");
            return;
        }

        if (computedStart >= computedEnd) {
            showToast("End time must be after start time", "warning");
            return;
        }


        const user = email || currentUser || "admin";
        const isEditing = !!editingEventId || !!editingGoogleEventId;
        const url = isEditing ? `${API}/updateEvent` : `${API}/addEvent`;
        
        const payload = {
            username: user,
            name: eventName,
            date: eventDate,
            start: computedStart,
            end: computedEnd,
            priority: priority,
            category: eventCategory,
            description: eventDescription,
            color: eventColor,
            reminders: selectedReminders
        };
        
        if (isEditing) {
            payload.id = editingEventId;
            payload.google_event_id = editingGoogleEventId;
        }

        setEventLoading(true);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            showToast(data.message, res.ok ? "success" : "error");

            if (res.ok) {
                setEditingEventId(null);
                setEditingGoogleEventId(null);
                setEventName("");
                setEventDate(getTodayDateStr());
                setStartTimeHour(getPresentTime12().hour);
                setStartTimeMinute(getPresentTime12().minute);
                setStartTimeAmPm(getPresentTime12().ampm);
                setEndTimeHour(getOneHourLaterTime12().hour);
                setEndTimeMinute(getOneHourLaterTime12().minute);
                setEndTimeAmPm(getOneHourLaterTime12().ampm);
                setPriority("Medium");
                setEventCategory("General");
                setEventDescription("");
                setEventColor("Default colour");
                setSelectedReminders([]);
                loadEvents();
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to connect to backend server", "error");
        } finally {
            setEventLoading(false);
        }

    }


    const getAssignmentStatus = React.useCallback((assign) => {
        if (assign.completed) return "Completed";
        if (assign.deadline) {
            const todayStr = new Date().toISOString().split('T')[0];
            if (assign.deadline < todayStr) {
                return "Overdue";
            }
        }
        return "Pending";
    }, []);

    async function handleAddAssignment(e) {
        e.preventDefault();
        if (!assignName || !assignDeadline) {
            showToast("Please fill in assignment details", "warning");
            return;
        }

        const user = email || currentUser || "admin";
        const isEditing = !!editingAssignId;
        const url = isEditing ? `${API}/updateAssignment` : `${API}/addAssignment`;
        
        const payload = {
            username: user,
            name: assignName,
            subject: assignSubject,
            deadline: assignDeadline
        };
        
        if (isEditing) {
            payload.id = editingAssignId;
        }

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            showToast(data.message, res.ok ? "success" : "error");

            if (res.ok) {
                setAssignName("");
                setAssignSubject("");
                setAssignDeadline("");
                setEditingAssignId(null);
                loadAssignments();
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to connect to backend server", "error");
        }
    }

    function handleOpenEditAssignment(assign) {
        setEditingAssignId(assign.id || null);
        setAssignName(assign.name || "");
        setAssignSubject(assign.subject || "");
        setAssignDeadline(assign.deadline || "");
        setActiveTab("schedule");
        showToast("Assignment loaded into Schedule editor.", "info");
    }

    function handleCancelEditAssignment() {
        setEditingAssignId(null);
        setAssignName("");
        setAssignSubject("");
        setAssignDeadline("");
    }

    async function handleDeleteAssignment(assign) {
        if (!window.confirm(`Are you sure you want to delete "${assign.name}"?`)) {
            return;
        }
        try {
            const user = email || currentUser || "admin";
            const res = await fetch(`${API}/deleteAssignment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user,
                    id: assign.id
                })
            });
            const data = await res.json();
            showToast(data.message, res.ok ? "success" : "error");
            loadAssignments();
        } catch (error) {
            console.error("Delete assignment failed:", error);
            showToast("Failed to connect to backend", "error");
        }
    }

    async function handleToggleAssignmentComplete(assign) {
        const nextCompleted = !assign.completed;
        
        // Optimistic UI update
        setAssignments(prev => prev.map(a => a.id === assign.id ? { ...a, completed: nextCompleted } : a));
        
        try {
            const user = email || currentUser || "admin";
            const res = await fetch(`${API}/toggleAssignmentComplete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user,
                    id: assign.id,
                    completed: nextCompleted
                })
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message, "error");
                // Rollback optimistic update
                loadAssignments();
            } else {
                showToast(nextCompleted ? "Assignment marked as completed!" : "Assignment marked as pending", "success");
                loadAssignments(); // final sync
            }
        } catch (error) {
            console.error("Toggle assignment complete failed:", error);
            showToast("Failed to connect to backend", "error");
            // Rollback optimistic update
            loadAssignments();
        }
    }

    async function handleAskAI(e, programmaticQuestion = null) {
        if (e && e.preventDefault) e.preventDefault();
        
        const questionToAsk = programmaticQuestion || aiQuestion;
        if (!questionToAsk || !questionToAsk.trim()) {
            showToast("Please type a question!", "warning");
            return;
        }

        const userQuestion = questionToAsk.trim();
        
        if (!currentSessionId) {
            const newId = Date.now().toString();
            setCurrentSessionId(newId);
            setChatSessions(prev => {
                const newSessions = [{ id: newId, title: "New Chat", messages: [], lastUpdated: Date.now() }, ...prev];
                localStorage.setItem("smartTimetableChatSessions", JSON.stringify(newSessions));
                return newSessions;
            });
        }

        // Optimistically append user's message
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages(prev => [
            ...prev,
            { sender: "user", text: userQuestion, time: timestamp }
        ]);

        if (!programmaticQuestion) {
            setAiQuestion(""); // Clear the input field immediately for performance feel
        }

        setAiLoading(true);
        try {
            const user = email || currentUser || "admin";
            const res = await fetch(`${API}/askAI`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: user,
                    question: userQuestion,
                    aiEngine: aiEngine,
                    aiModel: aiModel,
                    openrouterKey: openrouterKey,
                    huggingfaceToken: huggingfaceToken,
                    metrics: {
                        streak: appUsageStreak,
                        durationMap: usageDurationMap
                    }
                })
            });
            const data = await res.json();
            const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setChatMessages(prev => [
                ...prev,
                { sender: "ai", text: data.reply, time: aiTime }
            ]);
            setAiReply(data.reply); // Sync for backward compatibility
        } catch (error) {
            console.error(error);
            const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setChatMessages(prev => [
                ...prev,
                { sender: "ai", text: "I'm having trouble reaching the servers. Please check if your backend connection is active.", time: aiTime }
            ]);
            setAiReply("AI Server Not Connected");
        } finally {
            setAiLoading(false);
        }
    }

    async function handleGenerateSchedule(e) {
        if (e && e.preventDefault) e.preventDefault();
        
        const user = email || currentUser || "admin";
        setSchedulerLoading(true);
        setGeneratedSchedule("");
        
        try {
            const res = await fetch(`${API}/api/ai/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user,
                    duration: scheduleDuration,
                    studyHours: scheduleStudyHours,
                    scheduleType: scheduleType,
                    intensity: scheduleIntensity,
                    aiEngine: aiEngine,
                    aiModel: aiModel,
                    openrouterKey: openrouterKey,
                    huggingfaceToken: huggingfaceToken
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setGeneratedSchedule(data.plan);
                showToast("Personalized study timetable generated!", "success");
            } else {
                showToast(data.message || "Failed to generate schedule", "error");
            }
        } catch (error) {
            console.error("Scheduler failed:", error);
            showToast("Failed to connect to backend scheduler endpoint", "error");
        } finally {
            setSchedulerLoading(false);
        }
    }

    const triggerQuickPlanner = (type) => {
        let title = "Balanced Study Plan";
        let hours = 4;
        let days = 7;
        let level = "Moderate";
        
        if (type === "exam") {
            title = "Exam Preparation";
            hours = 6;
            days = 10;
            level = "Intensive";
        } else if (type === "assignment") {
            title = "Assignment Focus";
            hours = 3;
            days = 5;
            level = "Moderate";
        } else if (type === "goal") {
            title = "Productivity Boost";
            hours = 5;
            days = 14;
            level = "Intensive";
        }
        
        setScheduleType(title);
        setScheduleStudyHours(hours);
        setScheduleDuration(days);
        setScheduleIntensity(level);
        
        showToast(`Loaded ${title} template! Click 'Generate AI Schedule' to run.`, "info");
    };

    async function checkNotifications() {
        const user = email || currentUser || "admin";
        try {
            const res = await fetch(`${API}/events?username=${encodeURIComponent(user)}`);
            const data = await res.json();
            const now = new Date();
            
            data.forEach(event => {
                if (!event.date || !event.start) return;
                
                try {
                    const eventStart = new Date(`${event.date}T${event.start}:00`);
                    const eventId = event.id || event.google_event_id || event.name;

                    // 1. Direct starting now notification (within 90s window)
                    const diffNowMs = now - eventStart;
                    if (diffNowMs >= 0 && diffNowMs < 90000) {
                        const alertKey = `${eventId}_0_${event.date}_${event.start}`;
                        if (!triggeredAlertsRef.current[alertKey]) {
                            triggeredAlertsRef.current[alertKey] = true;
                            showToast(`Reminder: "${event.name}" is starting now!`, "info");
                        }
                    }
                    
                    // 2. Custom multiple reminders notifications
                    const reminders = event.reminders || [];
                    reminders.forEach(mins => {
                        const offset = parseInt(mins);
                        if (isNaN(offset) || offset <= 0) return;
                        
                        const reminderTime = new Date(eventStart.getTime() - offset * 60000);
                        const diffMs = now - reminderTime;
                        
                        // If current time is at or after the reminder time, and within a 90s window
                        if (diffMs >= 0 && diffMs < 90000) {
                            const alertKey = `${eventId}_${offset}_${event.date}_${event.start}`;
                            if (!triggeredAlertsRef.current[alertKey]) {
                                triggeredAlertsRef.current[alertKey] = true;
                                
                                let timeLabel = `${offset} minutes`;
                                if (offset === 60) timeLabel = "1 hour";
                                else if (offset === 1440) timeLabel = "1 day";
                                else if (offset > 60 && offset % 60 === 0) timeLabel = `${offset / 60} hours`;
                                
                                showToast(`Reminder: "${event.name}" starts in ${timeLabel}!`, "info");
                            }
                        }
                    });
                } catch (e) {
                    console.error("Error checking event notification:", e);
                }
            });
        } catch (error) {
            console.error("Notification check error:", error);
        }
    }


    // Activity Consistency Heatmap renderer showing scheduled event frequency over the last 35 days
    const renderActivityHeatMap = () => {
        const today = new Date();
        const heatmapData = [];
        let activeDays = 0;
        
        // Generate a 35-day grid (last 5 weeks) ending on today
        for (let i = 34; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            // Count events on this date
            const count = events.filter(e => e.date === dateStr).length;
            if (count > 0) {
                activeDays++;
            }
            
            heatmapData.push({ 
                date: dateStr, 
                count, 
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
            });
        }
        
        const consistencyScore = Math.round((activeDays / 35) * 100);
        
        // Calculate active streak
        let streak = 0;
        let streakDate = new Date();
        while (true) {
            const yyyy = streakDate.getFullYear();
            const mm = String(streakDate.getMonth() + 1).padStart(2, '0');
            const dd = String(streakDate.getDate()).padStart(2, '0');
            const dStr = `${yyyy}-${mm}-${dd}`;
            const count = events.filter(e => e.date === dStr).length;
            if (count > 0) {
                streak++;
                streakDate.setDate(streakDate.getDate() - 1);
            } else {
                break;
            }
        }

        return (
            <div className="card animate-fade-in" style={{ width: "100%", padding: "24px", marginTop: "25px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "800" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        Activity Consistency Heatmap
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", background: "var(--primary-light)", padding: "4px 8px", borderRadius: "10px" }}>Last 35 Days</span>
                </div>
                
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 15px 0" }}>
                    Visualizing your calendar usage frequency. Darker cells represent days with higher scheduled active density.
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", padding: "10px 0" }}>
                    {heatmapData.map((item, idx) => {
                        let bgColor = "rgba(139, 92, 246, 0.04)";
                        let borderColor = "var(--border)";
                        let glow = "none";
                        
                        if (item.count === 1) {
                            bgColor = "rgba(139, 92, 246, 0.2)";
                            borderColor = "rgba(139, 92, 246, 0.3)";
                        } else if (item.count === 2) {
                            bgColor = "rgba(139, 92, 246, 0.45)";
                            borderColor = "rgba(139, 92, 246, 0.55)";
                        } else if (item.count >= 3) {
                            bgColor = "var(--primary)";
                            borderColor = "var(--primary)";
                            glow = "0 0 10px rgba(139, 92, 246, 0.3)";
                        }
                        
                        return (
                            <div 
                                key={idx}
                                title={`${item.label}: ${item.count} event(s)`}
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "6px",
                                    background: bgColor,
                                    border: `1.5px solid ${borderColor}`,
                                    boxShadow: glow,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: item.count >= 2 ? "#ffffff" : "var(--text-main)",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "scale(1.15) translateY(-1px)";
                                    e.currentTarget.style.borderColor = "var(--primary)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = "scale(1) translateY(0)";
                                    e.currentTarget.style.borderColor = borderColor;
                                }}
                            >
                                {item.count > 0 ? item.count : ""}
                            </div>
                        );
                    })}
                </div>

                <div className="grid-3-col" style={{ gap: "15px", marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Consistency Score</span>
                        <span style={{ fontSize: "17px", fontWeight: "800", color: "var(--primary)" }}>{consistencyScore}%</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Streak</span>
                        <span style={{ fontSize: "17px", fontWeight: "800", color: "var(--primary)" }}>{streak} Days</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Days</span>
                        <span style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-main)" }}>{activeDays} / 35 Days</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth(); // 0-indexed
        
        // Days of current month
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        // First day of current month (0 = Sun, 1 = Mon, ...)
        const firstDayIndex = new Date(year, month, 1).getDay();
        
        // Days of previous month
        const prevTotalDays = new Date(year, month, 0).getDate();
        
        const days = [];
        
        // Previous month padding days
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevTotalDays - i;
            const prevMonthDate = new Date(year, month - 1, dayNum);
            days.push({
                date: prevMonthDate,
                dayNum,
                isCurrentMonth: false
            });
        }
        
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const currDate = new Date(year, month, i);
            days.push({
                date: currDate,
                dayNum: i,
                isCurrentMonth: true
            });
        }
        
        // Next month padding days to make total days multiple of 7
        const totalCells = days.length % 7 === 0 ? days.length : days.length + (7 - (days.length % 7));
        const nextDaysCount = totalCells - days.length;
        for (let i = 1; i <= nextDaysCount; i++) {
            const nextMonthDate = new Date(year, month + 1, i);
            days.push({
                date: nextMonthDate,
                dayNum: i,
                isCurrentMonth: false
            });
        }
        
        // Helper to format Date as YYYY-MM-DD
        const formatDateStr = (dObj) => {
            const y = dObj.getFullYear();
            const m = (dObj.getMonth() + 1).toString().padStart(2, '0');
            const d = dObj.getDate().toString().padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        
        const todayStr = formatDateStr(new Date());
        
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        const handlePrevMonth = () => {
            setCurrentMonth(new Date(year, month - 1, 1));
        };
        
        const handleNextMonth = () => {
            setCurrentMonth(new Date(year, month + 1, 1));
        };
        
        return (
            <div className="calendar-card">
                <div className="calendar-header">
                    <h3>{monthNames[month]} {year}</h3>
                    <div className="calendar-nav-buttons">
                        <button className="calendar-month-btn" type="button" onClick={handlePrevMonth} title="Previous Month">‹</button>
                        <button className="calendar-month-btn" type="button" onClick={handleNextMonth} title="Next Month">›</button>
                    </div>
                </div>
                <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div className="calendar-days-grid">
                    {(() => {
                        const usageMap = JSON.parse(localStorage.getItem("appUsageMap") || "{}");
                        return days.map((item, idx) => {
                            const dateStr = formatDateStr(item.date);
                            const isToday = dateStr === todayStr;
                            const isSelected = selectedCalendarDate === dateStr;
                            
                            // Check if this date has events or assignments
                            const within35Days = isDateWithin35Days(dateStr);
                            const dayEvents = within35Days ? events.filter(e => e.date === dateStr) : [];
                            const dayAssigns = within35Days ? assignments.filter(a => a.deadline === dateStr) : [];
                            
                            const hasEvents = dayEvents.length > 0;
                            const hasAssigns = dayAssigns.length > 0;
                            const count = dayEvents.length + dayAssigns.length;
                            const usageCount = usageMap[dateStr] || 0;
                            
                            const usageSeconds = usageDurationMap[dateStr] || 0;
                            
                            let dayClass = "calendar-day";
                            if (!item.isCurrentMonth) dayClass += " outside";
                            
                            // Generate custom heat map styling purely based on active app usage duration (seconds)
                            let heatmapStyle = {};
                            if (item.isCurrentMonth) {
                                if (usageSeconds > 0 && usageSeconds < 1800) {
                                    // Low: >0 to <30 minutes
                                    heatmapStyle = {
                                        background: activeTheme === "dark" ? "rgba(167, 139, 250, 0.20)" : "rgba(139, 92, 246, 0.20)",
                                        color: "var(--primary)",
                                        fontWeight: "700"
                                    };
                                } else if (usageSeconds >= 1800 && usageSeconds < 5400) {
                                    // Medium: 30 minutes to 1.5 hours
                                    heatmapStyle = {
                                        background: activeTheme === "dark" ? "rgba(167, 139, 250, 0.45)" : "rgba(139, 92, 246, 0.45)",
                                        color: activeTheme === "dark" ? "#ffffff" : "var(--primary-hover)",
                                        fontWeight: "700"
                                    };
                                } else if (usageSeconds >= 5400 && usageSeconds < 9000) {
                                    // High: 1.5 hours to 2.5 hours
                                    heatmapStyle = {
                                        background: activeTheme === "dark" ? "rgba(167, 139, 250, 0.75)" : "rgba(139, 92, 246, 0.75)",
                                        color: "#ffffff",
                                        fontWeight: "800",
                                        boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)"
                                    };
                                } else if (usageSeconds >= 9000) {
                                    // Ultra: 2.5 hours+
                                    heatmapStyle = {
                                        background: "var(--primary)",
                                        color: "#ffffff",
                                        fontWeight: "800",
                                        boxShadow: "0 6px 18px rgba(139, 92, 246, 0.55)", // Glowing high density shadow
                                        border: "1.5px solid rgba(255, 255, 255, 0.45)"
                                    };
                                }
                            }
                            
                            // Apply red circle border to any day the user logged in (usageCount > 0) or day in the active streak
                            const isInStreak = isDateInStreak(dateStr);
                            if (within35Days && (usageCount > 0 || isInStreak)) {
                                heatmapStyle = {
                                    ...heatmapStyle,
                                    border: "2.5px solid #ef4444", // Perfect red circle for days logged in or in streak
                                    fontWeight: "800"
                                };
                            }
                            
                            // Check if this date has overdue assignments
                            const hasOverdueAssign = (assignments || []).some(a => a.deadline === dateStr && getAssignmentStatus(a) === "Overdue");
                            if (hasOverdueAssign && within35Days) {
                                heatmapStyle = {
                                    ...heatmapStyle,
                                    border: "2.5px solid #ef4444", // Red border circle for overdue days
                                    color: "#ef4444", // Red text for visibility
                                    fontWeight: "800"
                                };
                            }
                            
                            // Dynamic style modifications for days exceeding the 35-day past limit
                            if (!within35Days && item.isCurrentMonth) {
                                heatmapStyle = {
                                    ...heatmapStyle,
                                    opacity: 0.3,
                                    cursor: "not-allowed",
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    boxShadow: "none"
                                };
                            }
                            
                            // Selected styling (renders a thin outline and lifts up slightly, preserving the original heatmap background color)
                            if (isSelected) {
                                heatmapStyle = {
                                    ...heatmapStyle,
                                    outline: "1.5px solid var(--text-main)",
                                    outlineOffset: "2.5px",
                                    transform: "translateY(-3px)", // Lifts up slightly
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", // Subtle shadow for depth
                                    fontWeight: "800"
                                };
                            }
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="calendar-day-cell"
                                    style={!within35Days && item.isCurrentMonth ? { cursor: "not-allowed" } : {}}
                                    onClick={() => {
                                        if (!within35Days) {
                                            showToast("Calendar past display is limited to 35 days.", "error");
                                            return;
                                        }
                                        if (selectedCalendarDate === dateStr) {
                                            setSelectedCalendarDate(null);
                                        } else {
                                            setSelectedCalendarDate(dateStr);
                                        }
                                    }}
                                >
                                    <div className={dayClass} style={heatmapStyle}>
                                        {item.dayNum}
                                        {(hasEvents || hasAssigns) && (
                                            <div className="calendar-dots">
                                                {hasEvents && <span className="dot dot-event" style={{ background: '#00e5ff', boxShadow: '0 0 5px #00e5ff', width: '6px', height: '6px' }}></span>}
                                                {hasAssigns && <span className="dot dot-assign" style={{ background: '#ffd700', boxShadow: '0 0 5px #ffd700', width: '6px', height: '6px' }}></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>

                {/* 4-color Heatmap Legend */}
                <div style={{ 
                    display: "flex", 
                    justifyContent: "flex-start", 
                    gap: "15px", 
                    alignItems: "center", 
                    marginTop: "16px", 
                    paddingTop: "12px", 
                    borderTop: "1px solid var(--border)"
                }}>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "600" }}>
                        Usage:
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.20)", border: "1px solid rgba(139, 92, 246, 0.3)" }}></span>
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: "600" }}>Low</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.45)", border: "1px solid rgba(139, 92, 246, 0.5)" }}></span>
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: "600" }}>Mid</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.75)", border: "1px solid rgba(139, 92, 246, 0.8)" }}></span>
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: "600" }}>High</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 6px rgba(139, 92, 246, 0.7)" }}></span>
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: "600" }}>Ultra</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (view === "landing") {
        return (
            <div className="landing-page">
                {/* LANDING NAVBAR */}
                <div className="navbar">
                    <div className="logo">
                        Smart Timetable {renderAIHighlight("AI")}
                    </div>
                    <div className="nav-actions">
                        <a href="#" className="btn-signin" onClick={(e) => { e.preventDefault(); setAuthMode("login"); setShowAuth(true); }}>Sign In</a>
                        <a href="#" className="btn-signup" onClick={(e) => { e.preventDefault(); setAuthMode("signup"); setShowAuth(true); }}>Sign Up</a>
                    </div>
                </div>

                {/* LANDING HERO */}
                <div className="landing-hero" style={{ padding: "80px 24px 60px", maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
                    <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", marginBottom: "20px", fontWeight: "800", letterSpacing: "-2.5px" }}>The future of scheduling <span>happens with {renderAIHighlight("AI")}</span></h1>
                    <p style={{ fontSize: "20px", color: "var(--text-muted)", lineHeight: "1.6", marginBottom: "60px", maxWidth: "700px", margin: "0 auto 60px" }}>
                        An intelligent schedule planner that helps you manage deadlines, automate calendars, and sync meetings effortlessly in a single glassmorphic workspace.
                    </p>

                    {/* THREE CLEAN DESCRIPTIVE FEATURE CARDS (STRICTLY TEXT ONLY) */}
                    <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", maxWidth: "1100px", margin: "0 auto 50px", textAlign: "left" }}>
                        
                        <div className="card" style={{ padding: "35px 30px", borderTop: "4px solid var(--primary)", borderRadius: "12px", minHeight: "220px", display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px", color: "var(--text-main)" }}>Smart Scheduler</h3>
                            <p style={{ fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.6", margin: 0 }}>
                                Organize meetings, lectures, and slots easily. Prioritize critical tasks, monitor active timelines in real-time, and manage recurring events in a single view.
                            </p>
                        </div>

                        <div className="card" style={{ padding: "35px 30px", borderTop: "4px solid var(--secondary)", borderRadius: "12px", minHeight: "220px", display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px", color: "var(--text-main)" }}>Deadline Tracker</h3>
                            <p style={{ fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.6", margin: 0 }}>
                                Track assignments, projects, and task due dates with high-contrast alert indicators that calculate exact remaining days to keep you on schedule.
                            </p>
                        </div>

                        <div className="card" style={{ padding: "35px 30px", borderTop: "4px solid #10b981", borderRadius: "12px", minHeight: "220px", display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px", color: "var(--text-main)" }}>{renderAIHighlight("AI")} Assistant</h3>
                            <p style={{ fontSize: "14.5px", color: "var(--text-muted)", lineHeight: "1.6", margin: 0 }}>
                                Interact with our intelligent natural language agent. Ask questions to instantly find free slots, get schedule breakdowns, or schedule reminders.
                            </p>
                        </div>

                    </div>
                </div>

                {/* AUTHENTICATION MODAL */}
                {showAuth && (
                    <div className="auth-overlay" style={{ zIndex: 1001 }}>
                        <div className="auth-modal">
                            <button className="btn-close" onClick={() => setShowAuth(false)}>×</button>
                            <h2>
                                {authMode === "login" ? "Sign In" : authMode === "signup" ? "Sign Up" : "Reset Password"}
                            </h2>
                            <p style={{ marginBottom: "20px" }}>
                                {otpSent 
                                    ? `A 4-digit code has been sent to ${otpPurpose === "signup" ? signupEmail : forgotEmail}.` 
                                    : authMode === "login" 
                                        ? "Enter your credentials to unlock your smart schedule." 
                                        : authMode === "signup"
                                            ? "Create your free workspace account to start scheduling."
                                            : "Reset your account password using a 4-digit verification code."}
                            </p>

                            {authError && (
                                <div style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "8px",
                                    color: "#ef4444",
                                    padding: "12px 16px",
                                    fontSize: "13.5px",
                                    fontWeight: "600",
                                    marginBottom: "20px",
                                    textAlign: "left",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span>{authError}</span>
                                </div>
                            )}

                            {otpSent ? (
                                otpPurpose === "signup" ? (
                                    <form onSubmit={handleVerifyAndRegister}>
                                        <div className="input-group">
                                            <label>Enter 4-Digit Verification Code</label>
                                            <input 
                                                type="text" 
                                                placeholder="XXXX" 
                                                maxLength={4}
                                                value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                                                required
                                                style={{ letterSpacing: "8px", textAlign: "center", fontSize: "20px", fontWeight: "bold" }}
                                            />
                                        </div>
                                        <button type="submit" className="btn-submit" style={{ marginTop: "15px" }}>
                                            Verify & Register
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-google" 
                                            style={{ marginTop: "10px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                            onClick={() => { setOtpSent(false); setOtp(""); }}
                                        >
                                            Back
                                        </button>
                                    </form>
                                ) : !otpVerified ? (
                                    <form onSubmit={handleVerifyForgotOtp}>
                                        <div className="input-group">
                                            <label>Enter 4-Digit Verification Code</label>
                                            <input 
                                                type="text" 
                                                placeholder="XXXX" 
                                                maxLength={4}
                                                value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                                                required
                                                style={{ letterSpacing: "8px", textAlign: "center", fontSize: "20px", fontWeight: "bold" }}
                                            />
                                        </div>
                                        <button type="submit" className="btn-submit" style={{ marginTop: "15px" }}>
                                            Verify Code
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-google" 
                                            style={{ marginTop: "10px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                            onClick={() => { setOtpSent(false); setOtp(""); }}
                                        >
                                            Back
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword}>
                                        <div className="input-group">
                                            <label>New Password</label>
                                            <input 
                                                type="password" 
                                                placeholder="Enter new password" 
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Confirm New Password</label>
                                            <input 
                                                type="password" 
                                                placeholder="Confirm new password" 
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn-submit" style={{ marginTop: "15px" }}>
                                            Reset Password & Login
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-google" 
                                            style={{ marginTop: "10px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                                            onClick={() => { setOtpVerified(false); }}
                                        >
                                            Back to Code Verification
                                        </button>
                                    </form>
                                )
                            ) : authMode === "forgot_password" ? (
                                <form onSubmit={handleSendForgotOtp}>
                                    <div className="input-group">
                                        <label>Recovery Email Address</label>
                                        <input 
                                            type="email" 
                                            placeholder="Enter your registered email" 
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-submit" style={{ marginTop: "10px" }}>
                                        Send Verification Code
                                    </button>
                                    <div className="auth-toggle" style={{ marginTop: "15px" }}>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode("login"); }}>
                                            Back to Sign In
                                        </a>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleAuthSubmit}>
                                    {authMode === "signup" && (
                                        <>
                                            <div className="input-group">
                                                <label>Full Name</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter your full name" 
                                                    value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Email Address</label>
                                                <input 
                                                    type="email" 
                                                    placeholder="Enter your email address" 
                                                    value={signupEmail}
                                                    onChange={e => setSignupEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    {authMode === "login" && (
                                        <div className="input-group">
                                            <label>Username/Email</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter username or email" 
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label>Password</label>
                                        <input 
                                            type="password" 
                                            placeholder="Enter password" 
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {authMode === "login" && (
                                        <div style={{ textAlign: "right", marginTop: "-12px", marginBottom: "15px" }}>
                                            <a 
                                                href="#" 
                                                className="forgot-password-link" 
                                                onClick={(e) => { e.preventDefault(); setAuthMode("forgot_password"); }}
                                                style={{ fontSize: "12.5px", color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}
                                            >
                                                Forgot Password?
                                            </a>
                                        </div>
                                    )}

                                    {authMode === "signup" && (
                                        <div className="input-group">
                                            <label>Confirm Password</label>
                                            <input 
                                                type="password" 
                                                placeholder="Confirm password" 
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}

                                    <button type="submit" className="btn-submit" style={{ marginTop: "10px" }}>
                                        {authMode === "login" ? "Sign In" : "Register Account"}
                                    </button>
                                    <div className="auth-divider">or</div>
                                    <button type="button" className="btn-google" onClick={() => window.location.href = "/login/google"}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                        </svg>
                                        Continue with Google
                                    </button>
                                </form>
                            )}

                            {!otpSent && (authMode === "login" || authMode === "signup") && (
                                <div className="auth-toggle">
                                    {authMode === "login" ? (
                                        <span>
                                            Don't have an account?{" "}
                                            <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode("signup"); }}>
                                                Sign Up
                                            </a>
                                        </span>
                                    ) : (
                                        <span>
                                            Already have an account?{" "}
                                            <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode("login"); }}>
                                                Sign In
                                            </a>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            {/* Custom Toast Notifications */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast-notification toast-${t.type}`}>
                        <span className="toast-message">{t.message}</span>
                        <button 
                            className="toast-close-btn" 
                            type="button"
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
    }
    return (
        <div className="dashboard-container">
            {/* RETRACTABLE LEFT SIDEBAR */}
            <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                {/* BRAND LOGO */}
                <div className="sidebar-brand">
                    <span className="sidebar-logo">Smart Timetable {renderAIHighlight("AI")}</span>
                    <button 
                        className="btn-toggle-sidebar" 
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {sidebarCollapsed ? "»" : "«"}
                    </button>
                </div>

                {/* SIDEBAR NAVIGATION ITEMS */}
                <div className="sidebar-menu">
                    {/* 1. Account */}
                    <button 
                        onClick={() => handleTabSwitch("account")} 
                        className={`sidebar-item ${activeTab === "account" ? "active" : ""}`}
                        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </span>
                        <span className="sidebar-item-text">Account</span>
                    </button>


                    {/* 3. Dashboard */}
                    <button 
                        onClick={() => handleTabSwitch("dashboard")} 
                        className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
                        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                                <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                                <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                                <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                            </svg>
                        </span>
                        <span className="sidebar-item-text">Dashboard</span>
                    </button>



                    {/* Analytics */}
                    <button 
                        onClick={() => handleTabSwitch("analytics")} 
                        className={`sidebar-item ${activeTab === "analytics" ? "active" : ""}`}
                        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                        </span>
                        <span className="sidebar-item-text">Analytics</span>
                    </button>


                    
                    {/* 6. Settings (Moved UP!) */}
                    <button 
                        onClick={() => handleTabSwitch("settings")} 
                        className={`sidebar-item ${activeTab === "settings" ? "active" : ""}`}
                        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </span>
                        <span className="sidebar-item-text">Settings</span>
                    </button>

                    {/* 7. Logout (Moved UP!) */}
                    <button 
                        onClick={handleLogout} 
                        className="sidebar-item"
                        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', color: 'var(--secondary)' }}>
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                            </svg>
                        </span>
                        <span className="sidebar-item-text" style={{ color: 'var(--secondary)', fontWeight: '700' }}>Logout</span>
                    </button>

                    {/* 8. FAQ (Placed in old settings slot with marginTop: "auto") */}
                    <button 
                        onClick={() => handleTabSwitch("faq")} 
                        className={`sidebar-item ${activeTab === "faq" ? "active" : ""}`}
                        style={{ marginTop: "auto", borderTop: "none", borderBottom: "none", borderRadius: 0, paddingTop: "15px", paddingBottom: "15px", background: 'transparent', borderLeft: 'none', borderRight: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </span>
                        <span className="sidebar-item-text">FAQ</span>
                    </button>

                    {/* 9. About (Placed in old logout slot at the very bottom with borderTop) */}
                    <button 
                        onClick={() => handleTabSwitch("about")} 
                        className={`sidebar-item ${activeTab === "about" ? "active" : ""}`}
                        style={{ borderTop: "1px solid var(--border)", borderBottom: "none", borderRadius: 0, paddingTop: "15px", paddingBottom: "15px", background: 'transparent', borderLeft: 'none', borderRight: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <span className="sidebar-item-icon">
                            <svg className="sidebar-item-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </span>
                        <span className="sidebar-item-text" style={{ fontWeight: '700' }}>About</span>
                    </button>
                </div>
            </div>

            {/* DYNAMIC MAIN CONTENT PANEL */}
            <div className={`dashboard-main-content ${sidebarCollapsed ? "collapsed" : ""}`}>

                {/* DASHBOARD TAB (SIDE-BY-SIDE LISTS) */}
                {activeTab === "dashboard" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>Dashboard</h2>
                            {renderHeaderNavigation("dashboard")}
                        </div>

                        {/* Interactive App Usage Streak Banner */}
                        <div className="card animate-fade-in" style={{ 
                            padding: "16px 20px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "15px", 
                            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(244, 63, 94, 0.08) 100%)", 
                            border: "1.5px solid rgba(139, 92, 246, 0.15)",
                            borderRadius: "16px",
                            boxShadow: "0 8px 25px -10px rgba(139, 92, 246, 0.25)",
                            marginTop: "-5px",
                            marginBottom: "-5px"
                        }}>
                            <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                width: "42px", 
                                height: "42px", 
                                borderRadius: "50%", 
                                flexShrink: 0,
                                background: "linear-gradient(135deg, #ff4e50, #f9d423)",
                                boxShadow: "0 0 12px rgba(255, 78, 80, 0.4)",
                                fontSize: "20px",
                                animation: "pulse 2s infinite"
                            }}>
                                
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "15.5px", fontWeight: "800", color: "var(--text-main)" }}>
                                    You're on a {appUsageStreak}-Day Streak!
                                </h4>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "var(--text-muted)", fontWeight: "500" }}>
                                    Keep opening the app daily to build consistency and stay on top of your schedule.
                                </p>
                            </div>
                        </div>

                        <div className="grid-2-col">
                            {/* LEFT COLUMN: THE INTERACTIVE CALENDAR */}
                            {renderCalendar()}

                        {/* RIGHT COLUMN: STACKED EVENTS AND ASSIGNMENT LISTS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                            {selectedCalendarDate && (
                                <div className="date-filter-banner">
                                    <div className="date-filter-info">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <span>Showing items for: {selectedCalendarDate}</span>
                                    </div>
                                    <button className="btn-clear-filter" onClick={() => setSelectedCalendarDate(null)}>
                                        Clear Filter
                                    </button>
                                </div>
                            )}

                            {/* EVENTS LIST VIEW */}
                            <div className="card" style={{ width: "100%", minHeight: "260px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                    <h3 style={{ margin: 0 }}>Calendar Events</h3>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPastEvents(!showPastEvents)}
                                            style={{
                                                width: "auto",
                                                padding: "6px 12px",
                                                marginTop: 0,
                                                fontSize: "12px",
                                                borderRadius: "8px",
                                                background: showPastEvents ? "var(--primary-light)" : "transparent",
                                                border: showPastEvents ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                                                color: showPastEvents ? "var(--primary)" : "var(--text-muted)",
                                                fontWeight: showPastEvents ? "700" : "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {showPastEvents ? "Showing All Events" : "Showing Future Only"}
                                        </button>
                                        <button className="btn-secondary" onClick={loadEvents} style={{ width: "auto", padding: "6px 12px", marginTop: 0, fontSize: "12px", borderRadius: "8px" }}>
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                                <div className="scroll-panel" style={{ maxHeight: "250px" }}>
                                    {(() => {
                                        const filtered = selectedCalendarDate 
                                            ? events.filter(e => e.date === selectedCalendarDate)
                                            : (showPastEvents ? events : events.filter(isEventActive));
                                        const sorted = [...filtered].sort((a, b) => {
                                            const dateA = new Date(`${a.date}T${a.start || "00:00"}`);
                                            const dateB = new Date(`${b.date}T${b.start || "00:00"}`);
                                            return dateA - dateB;
                                        });
                                        return sorted.length === 0 ? (
                                            <div className="info-empty">
                                                {selectedCalendarDate 
                                                     ? `No events scheduled for ${selectedCalendarDate}.`
                                                    : "No events on your Google Calendar."}
                                            </div>
                                        ) : (
                                            sorted.map((event, index) => {
                                                const colorClass = (event.color && event.color !== "Default colour") 
                                                    ? `color-card-${event.color.toLowerCase().replace(" ", "-")}` 
                                                    : "color-card-default";
                                                
                                                // Convert 24-hour time to beautiful 12-hour format for presentation
                                                const formatTimeTo12 = (t24) => {
                                                    if (!t24) return "";
                                                    const [hStr, mStr] = t24.split(":");
                                                    let h = parseInt(hStr);
                                                    let ap = "AM";
                                                    if (h >= 12) {
                                                        ap = "PM";
                                                        if (h > 12) h -= 12;
                                                    }
                                                    if (h === 0) h = 12;
                                                    return `${h.toString().padStart(2, '0')}:${mStr} ${ap}`;
                                                };

                                                return (
                                                    <div 
                                                        key={index} 
                                                        className={`event-card priority-card-${event.priority.toLowerCase()} ${colorClass}`}
                                                        onClick={() => {
                                                            if (activeContextMenuId === event.id && activeContextMenuType === 'event') {
                                                                setActiveContextMenuId(null);
                                                                setActiveContextMenuType(null);
                                                            } else {
                                                                setActiveContextMenuId(event.id);
                                                                setActiveContextMenuType('event');
                                                            }
                                                        }}
                                                        style={{ position: "relative", cursor: "pointer" }}
                                                    >
                                                        <div className="event-header">
                                                            <div className="event-title">{event.name}</div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <div className={`priority-tag priority-${event.priority.toLowerCase()}`}>
                                                                    {event.priority}
                                                                </div>
                                                                {/* Dynamic Event Status Badge */}
                                                                {(() => {
                                                                    const completed = isEventCompleted(event);
                                                                    const badgeBg = completed 
                                                                        ? (activeTheme === "dark" ? "rgba(16, 185, 129, 0.15)" : "#d1fae5")
                                                                        : (activeTheme === "dark" ? "rgba(59, 130, 246, 0.15)" : "#dbeafe");
                                                                    const badgeColor = completed ? "#10b981" : "#3b82f6";
                                                                    const badgeText = completed ? "Completed" : "Scheduled";
                                                                    
                                                                    return (
                                                                        <span style={{
                                                                            background: badgeBg,
                                                                            color: badgeColor,
                                                                            fontSize: "10.5px",
                                                                            fontWeight: "700",
                                                                            padding: "2.5px 8px",
                                                                            borderRadius: "12px",
                                                                            display: "inline-block",
                                                                            textTransform: "uppercase",
                                                                            letterSpacing: "0.5px"
                                                                        }}>
                                                                            {badgeText}
                                                                        </span>
                                                                    );
                                                                })()}
                                                                {/* Edit/Delete removed in favor of popup menu */}
                                                            </div>
                                                        </div>
                                                        <div className="event-details">
                                                            <span>Date: {event.date}</span>
                                                            <span>Time: {formatTimeTo12(event.start)} - {formatTimeTo12(event.end)}</span>
                                                        </div>
                                                        {event.description && (
                                                            <div className="event-desc" style={{ marginTop: "10px", fontSize: "13px", color: "var(--text-muted)", lineBreak: "anywhere", borderLeft: "2px solid var(--border)", paddingLeft: "8px", fontStyle: "italic" }}>
                                                                {event.description}
                                                            </div>
                                                        )}
                                                    {/* Reminders List */}
                                                    {event.reminders && event.reminders.length > 0 && (
                                                        <div className="event-reminders-indicator" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                                                            <span>Reminders:</span>
                                                            {event.reminders.map((r, ri) => {
                                                                let lbl = `${r}m`;
                                                                if (r === 60) lbl = "1h";
                                                                else if (r === 1440) lbl = "1d";
                                                                return (
                                                                    <span key={ri} style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid var(--border)", padding: "2px 6px", borderRadius: "6px" }}>
                                                                        {lbl}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Context Menu Popup for Events */}
                                                    {activeContextMenuId === event.id && activeContextMenuType === 'event' && (
                                                        <div 
                                                            className="context-menu-popup"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                position: "absolute",
                                                                right: "15px",
                                                                top: "50px",
                                                                zIndex: 999,
                                                                padding: "8px",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                gap: "6px",
                                                                width: "calc(100% - 30px)",
                                                                maxWidth: "200px",
                                                                background: activeTheme === "dark" ? "rgba(30, 27, 75, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                                                border: "1.5px solid var(--primary)",
                                                                borderRadius: "10px",
                                                                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                                                                backdropFilter: "blur(10px)"
                                                            }}
                                                        >
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenEditModal(event);
                                                                    setActiveContextMenuId(null);
                                                                    setActiveContextMenuType(null);
                                                                }}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                    fontSize: "12.5px",
                                                                    fontWeight: "600",
                                                                    padding: "8px 12px",
                                                                    margin: 0,
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    width: "100%",
                                                                    textAlign: "left",
                                                                    cursor: "pointer",
                                                                    justifyContent: "flex-start",
                                                                    background: "transparent",
                                                                    color: "var(--text-main)"
                                                                }}
                                                                onMouseOver={e => e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)"}
                                                                onMouseOut={e => e.currentTarget.style.background = "transparent"}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                                <span>Edit Event</span>
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteEvent(event);
                                                                    setActiveContextMenuId(null);
                                                                    setActiveContextMenuType(null);
                                                                }}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                    fontSize: "12.5px",
                                                                    fontWeight: "600",
                                                                    padding: "8px 12px",
                                                                    margin: 0,
                                                                    border: "none",
                                                                    borderRadius: "6px",
                                                                    width: "100%",
                                                                    textAlign: "left",
                                                                    cursor: "pointer",
                                                                    justifyContent: "flex-start",
                                                                    background: "transparent",
                                                                    color: "#ef4444"
                                                                }}
                                                                onMouseOver={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                                                onMouseOut={e => e.currentTarget.style.background = "transparent"}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                </svg>
                                                                <span>Delete Event</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })

                                    );
                                    })()}
                                </div>
                            </div>

                            {/* LIST ASSIGNMENTS */}
                            <div className="card" id="assignmentSection" style={{ width: "100%", minHeight: "260px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                    <h3 style={{ margin: 0 }}>Assignment Tracker</h3>
                                    <button className="btn-secondary" onClick={loadAssignments} style={{ width: "auto", padding: "6px 12px", marginTop: 0, fontSize: "12px", borderRadius: "8px" }}>
                                        Refresh
                                    </button>
                                </div>
                                <div className="scroll-panel" style={{ maxHeight: "250px", paddingBottom: activeContextMenuId ? "120px" : "15px", transition: "padding-bottom 0.2s ease" }}>
                                    {(() => {
                                        const filtered = selectedCalendarDate 
                                            ? assignments.filter(a => a.deadline === selectedCalendarDate)
                                            : assignments;
                                        const sorted = [...filtered].sort((a, b) => {
                                            const dateA = new Date(a.deadline);
                                            const dateB = new Date(b.deadline);
                                            return dateA - dateB;
                                        });
                                        return sorted.length === 0 ? (
                                            <div className="info-empty">
                                                {selectedCalendarDate 
                                                    ? `No assignments due on ${selectedCalendarDate}.`
                                                    : "No pending assignments."}
                                            </div>
                                        ) : (
                                            sorted.map((assign, index) => (
                                                <div 
                                                    key={index} 
                                                    className="assignment-card" 
                                                    onClick={() => {
                                                        if (activeContextMenuId === assign.id && activeContextMenuType === 'assignment') {
                                                            setActiveContextMenuId(null);
                                                            setActiveContextMenuType(null);
                                                        } else {
                                                            setActiveContextMenuId(assign.id);
                                                            setActiveContextMenuType('assignment');
                                                        }
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", gap: "15px", position: "relative", cursor: "pointer" }}
                                                >
                                                    {/* Left Checkbox Toggle */}
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleAssignmentComplete(assign);
                                                        }} 
                                                        style={{
                                                            background: assign.completed ? "var(--primary)" : "transparent",
                                                            border: `2px solid ${assign.completed ? "var(--primary)" : "var(--text-muted)"}`,
                                                            borderRadius: "6px",
                                                            width: "22px",
                                                            height: "22px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            cursor: "pointer",
                                                            color: "#ffffff",
                                                            padding: 0,
                                                            transition: "all 0.2s"
                                                        }}
                                                    >
                                                        {assign.completed && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        )}
                                                    </button>
                                                    
                                                    {/* Center Assignment Details */}
                                                    <div className="assignment-info" style={{ flex: 1 }}>
                                                        <h4 style={{ margin: 0, textDecoration: assign.completed ? "line-through" : "none", opacity: assign.completed ? 0.6 : 1 }}>{assign.name}</h4>
                                                        <p style={{ margin: "2px 0 0 0" }}>{assign.subject || "No Subject"}</p>
                                                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                                                            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
                                                                Deadline: {assign.deadline}
                                                            </span>
                                                            {assign.warning && !assign.completed && (
                                                                <span className="warning-badge" style={{ padding: "2px 8px", fontSize: "10px", animation: "pulse 2s infinite" }}>{assign.warning}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Status Badge & Actions */}
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                                                        {/* Dynamic Status Badge */}
                                                        {(() => {
                                                            const status = getAssignmentStatus(assign);
                                                            let badgeBg = "";
                                                            let badgeColor = "";
                                                            
                                                            if (status === "Completed") {
                                                                badgeBg = activeTheme === "dark" ? "rgba(16, 185, 129, 0.15)" : "#d1fae5";
                                                                badgeColor = "#10b981";
                                                            } else if (status === "Overdue") {
                                                                badgeBg = activeTheme === "dark" ? "rgba(239, 68, 68, 0.15)" : "#fee2e2";
                                                                badgeColor = "#ef4848";
                                                            } else { // Pending
                                                                badgeBg = activeTheme === "dark" ? "rgba(245, 158, 11, 0.15)" : "#fef3c7";
                                                                badgeColor = "#f59e0b";
                                                            }
                                                            
                                                            return (
                                                                <span style={{
                                                                    background: badgeBg,
                                                                    color: badgeColor,
                                                                    fontSize: "10.5px",
                                                                    fontWeight: "700",
                                                                    padding: "2.5px 8px",
                                                                    borderRadius: "12px",
                                                                    display: "inline-block",
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.5px"
                                                                }}>
                                                                    {status}
                                                                </span>
                                                            );
                                                        })()}
                                                        
                                                        {/* Actions */}
                                                        {/* Actions removed in favor of popup menu */}
                                                    </div>
                                                    
                                                    {/* Floating Click-options Popover Menu */}
                                                    {activeContextMenuId === assign.id && activeContextMenuType === 'assignment' && (
                                                        <>
                                                            <div 
                                                                className="assign-menu-backdrop"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveContextMenuId(null);
                                                                    setActiveContextMenuType(null);
                                                                }}
                                                                style={{
                                                                    position: "fixed",
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    zIndex: 998,
                                                                    background: "transparent"
                                                                }}
                                                            />
                                                            <div 
                                                                className="assign-menu-popover card"
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    position: "absolute",
                                                                    right: "15px",
                                                                    top: "50px",
                                                                    zIndex: 999,
                                                                    padding: "8px",
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    gap: "6px",
                                                                    width: "calc(100% - 30px)",
                                                                    maxWidth: "200px",
                                                                    background: activeTheme === "dark" ? "rgba(30, 27, 75, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                                                    border: "1.5px solid var(--primary)",
                                                                    borderRadius: "10px",
                                                                    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                                                                    backdropFilter: "blur(10px)"
                                                                }}
                                                            >
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleAssignmentComplete(assign);
                                                                        setActiveContextMenuId(null);
                                                                        setActiveContextMenuType(null);
                                                                    }}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        fontSize: "12.5px",
                                                                        fontWeight: "600",
                                                                        padding: "8px 12px",
                                                                        margin: 0,
                                                                        border: "none",
                                                                        borderRadius: "6px",
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        cursor: "pointer",
                                                                        justifyContent: "flex-start",
                                                                        background: "transparent",
                                                                        color: "var(--text-main)"
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)"}
                                                                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={assign.completed ? "var(--text-muted)" : "#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        {assign.completed ? (
                                                                            <circle cx="12" cy="12" r="10"></circle>
                                                                        ) : (
                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                        )}
                                                                    </svg>
                                                                    <span>{assign.completed ? "Mark Pending" : "Mark Complete"}</span>
                                                                </button>

                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenEditAssignment(assign);
                                                                        setActiveContextMenuId(null);
                                                                        setActiveContextMenuType(null);
                                                                    }}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        fontSize: "12.5px",
                                                                        fontWeight: "600",
                                                                        padding: "8px 12px",
                                                                        margin: 0,
                                                                        border: "none",
                                                                        borderRadius: "6px",
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        cursor: "pointer",
                                                                        justifyContent: "flex-start",
                                                                        background: "transparent",
                                                                        color: "var(--text-main)"
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)"}
                                                                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                    </svg>
                                                                    <span>Edit Assignment</span>
                                                                </button>

                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteAssignment(assign);
                                                                        setActiveContextMenuId(null);
                                                                        setActiveContextMenuType(null);
                                                                    }}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        fontSize: "12.5px",
                                                                        fontWeight: "600",
                                                                        padding: "8px 12px",
                                                                        margin: 0,
                                                                        border: "none",
                                                                        borderRadius: "6px",
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        cursor: "pointer",
                                                                        justifyContent: "flex-start",
                                                                        background: "transparent",
                                                                        color: "#ef4444"
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                                                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                    </svg>
                                                                    <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                {/* SCHEDULE TAB (SIDE-BY-SIDE REDESIGNED CARDS) */}
                {activeTab === "schedule" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>Schedule</h2>
                            {renderHeaderNavigation("schedule")}
                        </div>

                        <div className="grid-2-col" style={{ marginTop: 0 }}>
                        {/* REDESIGNED EVENT CARD */}
                        <div className="card">
                            <h3>{editingEventId || editingGoogleEventId ? "Edit Event" : "Add Event"}</h3>
                            <form onSubmit={handleEventSubmit}>
                                <div className="input-group">
                                    <label>Event Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter meeting, lecture, etc." 
                                        value={eventName}
                                        onChange={e => setEventName(e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Custom Premium Date Picker */}
                                <div className="input-group" style={{ position: "relative" }}>
                                    <label>Date</label>
                                    <input 
                                        type="text" 
                                        placeholder="Select date" 
                                        value={eventDate}
                                        onClick={() => {
                                            setShowDatePicker(true);
                                            // Pre-fill calendar view with selected date if valid
                                            if (eventDate) {
                                                const dParsed = new Date(eventDate);
                                                if (!isNaN(dParsed.getTime())) {
                                                    setPickerMonth(dParsed.getMonth());
                                                    setPickerYear(dParsed.getFullYear());
                                                }
                                            }
                                        }}
                                        readOnly
                                        required
                                        style={{ cursor: "pointer" }}
                                    />
                                    {showDatePicker && (
                                        <>
                                            <div 
                                                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: "transparent" }} 
                                                onClick={() => setShowDatePicker(false)} 
                                            />
                                            <div className="custom-datepicker-popover" style={{ zIndex: 1000 }}>
                                                <div className="datepicker-header">
                                                    <button type="button" className="datepicker-month-btn" onClick={() => {
                                                        if (pickerMonth === 0) {
                                                            setPickerMonth(11);
                                                            setPickerYear(pickerYear - 1);
                                                        } else {
                                                            setPickerMonth(pickerMonth - 1);
                                                        }
                                                    }}>‹</button>
                                                    <h3>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][pickerMonth]} {pickerYear}</h3>
                                                    <button type="button" className="datepicker-month-btn" onClick={() => {
                                                        if (pickerMonth === 11) {
                                                            setPickerMonth(0);
                                                            setPickerYear(pickerYear + 1);
                                                        } else {
                                                            setPickerMonth(pickerMonth + 1);
                                                        }
                                                    }}>›</button>
                                                </div>
                                                <div className="datepicker-weekdays">
                                                    <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                                                </div>
                                                <div className="datepicker-grid">
                                                    {(() => {
                                                        const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                                                        const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();
                                                        const cells = [];
                                                        
                                                        // Previous month padding
                                                        for (let i = 0; i < firstDayIndex; i++) {
                                                            cells.push(<div key={`empty-${i}`} className="datepicker-day-cell empty"></div>);
                                                        }
                                                        
                                                        // Current month days
                                                        const todayStr = new Date().toISOString().split('T')[0];
                                                        for (let d = 1; d <= daysInMonth; d++) {
                                                            const mStr = (pickerMonth + 1).toString().padStart(2, '0');
                                                            const dStr = d.toString().padStart(2, '0');
                                                            const cellDateStr = `${pickerYear}-${mStr}-${dStr}`;
                                                            
                                                            const isPast = cellDateStr < todayStr;
                                                            const isSelected = eventDate === cellDateStr;
                                                            
                                                            cells.push(
                                                                <div key={`day-${d}`} className="datepicker-day-cell">
                                                                    <button
                                                                        type="button"
                                                                        disabled={isPast}
                                                                        className={`datepicker-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                                                                        onClick={() => {
                                                                            setEventDate(cellDateStr);
                                                                            setShowDatePicker(false);
                                                                        }}
                                                                    >
                                                                        {d}
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        return cells;
                                                    })()}
                                                </div>
                                                <div className="datepicker-shortcuts">
                                                    <button type="button" className="btn-secondary" style={{ marginTop: 0, fontSize: "11px", padding: "4px 8px" }} onClick={() => {
                                                        const todayS = new Date().toISOString().split('T')[0];
                                                        setEventDate(todayS);
                                                        setPickerMonth(new Date().getMonth());
                                                        setPickerYear(new Date().getFullYear());
                                                        setShowDatePicker(false);
                                                    }}>Today</button>
                                                    <button type="button" className="btn-secondary" style={{ marginTop: 0, fontSize: "11px", padding: "4px 8px" }} onClick={() => {
                                                        setEventDate("");
                                                        setShowDatePicker(false);
                                                    }}>Clear</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Custom Premium Start & End Time Pickers (12-Hour formatted scroll lists) */}
                                <div className="grid-2-col" style={{ gap: "15px", marginBottom: "15px", gridTemplateColumns: "1fr 1fr" }}>
                                    
                                    {/* Start Time input */}
                                    <div className="input-group" style={{ margin: 0, position: "relative" }}>
                                        <label>Start Time</label>
                                        <input 
                                            type="text" 
                                            placeholder="Select start" 
                                            value={`${startTimeHour}:${startTimeMinute} ${startTimeAmPm}`}
                                            onClick={() => setShowStartTimePicker(true)}
                                            readOnly
                                            required
                                            style={{ cursor: "pointer" }}
                                        />
                                        {showStartTimePicker && (
                                            <>
                                                <div 
                                                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: "transparent" }} 
                                                    onClick={() => setShowStartTimePicker(false)} 
                                                />
                                                <div className="custom-timepicker-popover" style={{ zIndex: 1000 }}>
                                                    <div className="timepicker-grid">
                                                        <div className="timepicker-column">
                                                            <div className="timepicker-column-header">Hour</div>
                                                            <div className="timepicker-column-list">
                                                                {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => (
                                                                    <button 
                                                                        key={h}
                                                                        type="button" 
                                                                        className={`timepicker-option ${startTimeHour === h ? 'selected' : ''}`}
                                                                        onClick={() => setStartTimeHour(h)}
                                                                    >
                                                                        {h}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="timepicker-column">
                                                            <div className="timepicker-column-header">Min</div>
                                                            <div className="timepicker-column-list">
                                                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                                                    <button 
                                                                        key={m}
                                                                        type="button" 
                                                                        className={`timepicker-option ${startTimeMinute === m ? 'selected' : ''}`}
                                                                        onClick={() => setStartTimeMinute(m)}
                                                                    >
                                                                        {m}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="timepicker-column">
                                                            <div className="timepicker-column-header">Period</div>
                                                            <div className="timepicker-column-list">
                                                                {["AM","PM"].map(p => (
                                                                    <button 
                                                                        key={p}
                                                                        type="button" 
                                                                        className={`timepicker-option ${startTimeAmPm === p ? 'selected' : ''}`}
                                                                        onClick={() => setStartTimeAmPm(p)}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="timepicker-footer">
                                                        <button type="button" className="btn-primary" style={{ marginTop: 0, width: "100%", padding: "8px", fontSize: "12px", borderRadius: "6px" }} onClick={() => setShowStartTimePicker(false)}>
                                                            Set Time
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* End Time input */}
                                    <div className="input-group" style={{ margin: 0, position: "relative" }}>
                                        <label>End Time</label>
                                        <input 
                                            type="text" 
                                            placeholder="Select end" 
                                            value={`${endTimeHour}:${endTimeMinute} ${endTimeAmPm}`}
                                            onClick={() => setShowEndTimePicker(true)}
                                            readOnly
                                            required
                                            style={{ cursor: "pointer" }}
                                        />
                                        {showEndTimePicker && (
                                            <>
                                                <div 
                                                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: "transparent" }} 
                                                    onClick={() => setShowEndTimePicker(false)} 
                                                />
                                                <div className="custom-timepicker-popover" style={{ zIndex: 1000 }}>
                                                    <div className="timepicker-grid">
                                                        <div className="timepicker-column">
                                                            <div className="timepicker-column-header">Hour</div>
                                                            <div className="timepicker-column-list">
                                                                {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => (
                                                                    <button 
                                                                        key={h}
                                                                        type="button" 
                                                                        className={`timepicker-option ${endTimeHour === h ? 'selected' : ''}`}
                                                                        onClick={() => setEndTimeHour(h)}
                                                                    >
                                                                        {h}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="timepicker-column">
                                                            <div className="timepicker-column-header">Min</div>
                                                            <div className="timepicker-column-list">
                                                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                                                    <button 
                                                                        key={m}
                                                                        type="button" 
                                                                        className={`timepicker-option ${endTimeMinute === m ? 'selected' : ''}`}
                                                                        onClick={() => setEndTimeMinute(m)}
                                                                    >
                                                                        {m}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="timepicker-column">
                                                            <div className="timepicker-column-header">Period</div>
                                                            <div className="timepicker-column-list">
                                                                {["AM","PM"].map(p => (
                                                                    <button 
                                                                        key={p}
                                                                        type="button" 
                                                                        className={`timepicker-option ${endTimeAmPm === p ? 'selected' : ''}`}
                                                                        onClick={() => setEndTimeAmPm(p)}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="timepicker-footer">
                                                        <button type="button" className="btn-primary" style={{ marginTop: 0, width: "100%", padding: "8px", fontSize: "12px", borderRadius: "6px" }} onClick={() => setShowEndTimePicker(false)}>
                                                            Set Time
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="input-group" ref={priorityRef}>
                                    <label>Priority</label>
                                    <div className="custom-select-container">
                                        <div 
                                            className={`custom-select-trigger ${showPriorityDropdown ? 'active' : ''}`}
                                            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                        >
                                            <span className="custom-select-value">
                                                <span className={`custom-select-bullet ${priority.toLowerCase()}`}></span>
                                                {priority}
                                            </span>
                                            <svg 
                                                className="custom-select-arrow" 
                                                width="12" 
                                                height="12" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        {showPriorityDropdown && (
                                            <ul className="custom-select-options">
                                                {["High", "Medium", "Low"].map(val => (
                                                    <li 
                                                        key={val}
                                                        className={`custom-select-option ${val.toLowerCase()}-priority ${priority === val ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setPriority(val);
                                                            setShowPriorityDropdown(false);
                                                        }}
                                                    >
                                                        <span className={`custom-select-bullet ${val.toLowerCase()}`}></span>
                                                        {val}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Category Selector */}
                                <div className="input-group">
                                    <label>Category</label>
                                    <select
                                        value={eventCategory}
                                        onChange={e => setEventCategory(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "11px 14px",
                                            borderRadius: "8px",
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--text-main)",
                                            fontSize: "13.5px",
                                            fontFamily: "inherit",
                                            cursor: "pointer",
                                            appearance: "none",
                                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                            backgroundRepeat: "no-repeat",
                                            backgroundPosition: "right 12px center",
                                            paddingRight: "36px"
                                        }}
                                    >
                                        {["General", "Lecture", "Lab", "Study", "Assignment", "Exam", "Meeting", "Workshop", "Sport", "Personal", "Other"].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom rich Description Field */}
                                <div className="input-group">
                                    <label>Event Description</label>
                                    <textarea 
                                        placeholder="Add description, location, or notes..." 
                                        value={eventDescription}
                                        onChange={e => setEventDescription(e.target.value)}
                                        style={{ 
                                            width: "100%", 
                                            minHeight: "75px", 
                                            maxHeight: "150px", 
                                            padding: "12px 14px", 
                                            fontSize: "13.5px", 
                                            borderRadius: "8px",
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--text-main)",
                                            fontFamily: "inherit",
                                            resize: "vertical"
                                        }}
                                    />
                                </div>

                                {/* Custom Google Calendar Color Selector Grid */}
                                <div className="input-group">
                                    <label style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Event Theme Color</span>
                                        <span style={{ fontSize: "11px", color: "var(--primary)" }}>{eventColor}</span>
                                    </label>
                                    <div className="color-palette-picker" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1.5px solid var(--border)" }}>
                                        {[
                                            { name: "Tomato", color: "#dc2127" },
                                            { name: "Tangerine", color: "#ffb878" },
                                            { name: "Banana", color: "#fbd75b" },
                                            { name: "Basil", color: "#51b749" },
                                            { name: "Sage", color: "#7ae7bf" },
                                            { name: "Peacock", color: "#46d6db" },
                                            { name: "Blueberry", color: "#5484ed" },
                                            { name: "Lavender", color: "#a4bdfc" },
                                            { name: "Grape", color: "#dbadff" },
                                            { name: "Flamingo", color: "#ff887c" },
                                            { name: "Graphite", color: "#e1e1e1" },
                                            { name: "Default colour", color: "#4285f4" }
                                        ].map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                title={item.name}
                                                className={`color-palette-circle ${eventColor === item.name ? 'active' : ''}`}
                                                style={{ 
                                                    background: item.color, 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    borderRadius: "50%", 
                                                    border: "2px solid transparent",
                                                    boxShadow: eventColor === item.name ? `0 0 0 2px var(--surface), 0 0 0 4px ${item.color}` : "none",
                                                    cursor: "pointer",
                                                    transition: "transform 0.15s, box-shadow 0.15s",
                                                    padding: 0
                                                }}
                                                onClick={() => setEventColor(item.name)}
                                                onMouseOver={e => e.currentTarget.style.transform = "scale(1.15)"}
                                                onMouseOut={e => e.currentTarget.style.transform = eventColor === item.name ? "scale(1)" : "scale(1)"}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Multiple Reminders (Max 3) */}
                                <div className="input-group">
                                    <label style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Event Reminders (Select up to 3)</span>
                                        <span style={{ fontSize: "11px", color: selectedReminders.length >= 3 ? "var(--secondary)" : "var(--text-muted)" }}>
                                            {selectedReminders.length}/3 selected
                                        </span>
                                    </label>
                                    
                                    {/* Display Active Reminders */}
                                    {selectedReminders.length > 0 && (
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                                            {selectedReminders.map((mins, idx) => {
                                                let lbl = `${mins} mins before`;
                                                if (mins === 60) lbl = "1 hour before";
                                                else if (mins > 60 && mins % 60 === 0) lbl = `${mins / 60} hours before`;
                                                else if (mins === 1440) lbl = "1 day before";
                                                else if (mins > 1440 && mins % 1440 === 0) lbl = `${mins / 1440} days before`;
                                                return (
                                                    <span 
                                                        key={idx} 
                                                        style={{ 
                                                            background: "rgba(139, 92, 246, 0.1)", 
                                                            color: "var(--primary)", 
                                                            border: "1.5px solid var(--border)", 
                                                            borderRadius: "15px", 
                                                            padding: "4px 10px", 
                                                            fontSize: "12px", 
                                                            fontWeight: "600",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px"
                                                        }}
                                                    >
                                                        {lbl}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setSelectedReminders(prev => prev.filter((_, i) => i !== idx))}
                                                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: "800", fontSize: "12px", padding: 0 }}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Add Custom Reminder Selector within now-to-event timeframe */}
                                    {selectedReminders.length < 3 ? (
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <input 
                                                type="number" 
                                                placeholder="Offset value" 
                                                id="reminderVal"
                                                min="1"
                                                style={{ flex: 1, padding: "10px 14px", fontSize: "13px", height: "42px" }}
                                            />
                                            <div 
                                                className="custom-select-container" 
                                                ref={reminderUnitRef}
                                                style={{ width: "130px" }}
                                            >
                                                <input 
                                                    type="hidden" 
                                                    id="reminderUnit" 
                                                    value={reminderUnit} 
                                                />
                                                <div 
                                                    className={`custom-select-trigger ${showReminderUnitDropdown ? 'active' : ''}`}
                                                    onClick={() => setShowReminderUnitDropdown(!showReminderUnitDropdown)}
                                                    style={{ padding: "10px 14px", fontSize: "13px", height: "42px" }}
                                                >
                                                    <span className="custom-select-value">
                                                        {reminderUnit === "1" ? "Minutes" : reminderUnit === "60" ? "Hours" : "Days"}
                                                    </span>
                                                    <svg 
                                                        className="custom-select-arrow" 
                                                        width="10" 
                                                        height="10" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2.5" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                </div>
                                                {showReminderUnitDropdown && (
                                                    <ul className="custom-select-options" style={{ minWidth: "120px" }}>
                                                        {[
                                                            { label: "Minutes", val: "1" },
                                                            { label: "Hours", val: "60" },
                                                            { label: "Days", val: "1440" }
                                                        ].map(item => (
                                                            <li 
                                                                key={item.val}
                                                                className={`custom-select-option ${reminderUnit === item.val ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setReminderUnit(item.val);
                                                                    setShowReminderUnitDropdown(false);
                                                                }}
                                                                style={{ padding: "8px 10px", fontSize: "13px" }}
                                                            >
                                                                {item.label}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <button 
                                                type="button"
                                                className="btn-primary"
                                                onClick={() => {
                                                    const valEl = document.getElementById("reminderVal");
                                                    const unitEl = document.getElementById("reminderUnit");
                                                    if (!valEl || !unitEl) return;
                                                    
                                                    const val = parseInt(valEl.value);
                                                    if (isNaN(val) || val <= 0) {
                                                        showToast("Please enter a valid positive number!", "warning");
                                                        return;
                                                    }
                                                    
                                                    const unit = parseInt(unitEl.value);
                                                    const offsetMins = val * unit;
                                                    
                                                    const computedReminderStart = convert12to24(startTimeHour, startTimeMinute, startTimeAmPm);
                                                    if (!eventDate || !computedReminderStart) {
                                                        showToast("Please select the event date and start time first!", "warning");
                                                        return;
                                                    }
                                                    
                                                    const eventStart = new Date(`${eventDate}T${computedReminderStart}:00`);
                                                    const now = new Date();
                                                    const maxOffsetMins = Math.floor((eventStart - now) / 60000);
                                                    
                                                    if (maxOffsetMins <= 0) {
                                                        showToast("Cannot schedule reminders for an event starting in the past!", "warning");
                                                        return;
                                                    }
                                                    
                                                    if (offsetMins > maxOffsetMins) {
                                                        let maxLabel = `${maxOffsetMins} minutes`;
                                                        if (maxOffsetMins >= 60) maxLabel = `${Math.floor(maxOffsetMins / 60)} hours`;
                                                        showToast(`Reminder must be between now and the event start! Max offset is ${maxLabel}.`, "warning");
                                                        return;
                                                    }
                                                    
                                                    if (selectedReminders.includes(offsetMins)) {
                                                        showToast("This reminder offset is already added!", "warning");
                                                        return;
                                                    }
                                                    
                                                    setSelectedReminders(prev => [...prev, offsetMins].sort((a,b) => a-b));
                                                    valEl.value = ""; // Clear input
                                                    showToast("Reminder offset added successfully!", "success");
                                                }}
                                                style={{ width: "auto", padding: "10px 16px", marginTop: 0, fontSize: "13px", height: "42px", borderRadius: "8px" }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                            Maximum of 3 reminders reached.
                                        </span>
                                    )}
                                </div>


                                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }} disabled={eventLoading}>
                                        {eventLoading ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                <span className="loader-spinner"></span>
                                                {editingEventId || editingGoogleEventId ? "Saving Changes..." : "Creating Event..."}
                                            </span>
                                        ) : (
                                            editingEventId || editingGoogleEventId ? "Save Changes" : "Create Event"
                                        )}
                                    </button>
                                    {(editingEventId || editingGoogleEventId) && (
                                        <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            onClick={() => {
                                                setEditingEventId(null);
                                                setEditingGoogleEventId(null);
                                                setEventName("");
                                                setEventDate(getTodayDateStr());
                                                setStartTimeHour(getPresentTime12().hour);
                                                setStartTimeMinute(getPresentTime12().minute);
                                                setStartTimeAmPm(getPresentTime12().ampm);
                                                setEndTimeHour(getOneHourLaterTime12().hour);
                                                setEndTimeMinute(getOneHourLaterTime12().minute);
                                                setEndTimeAmPm(getOneHourLaterTime12().ampm);
                                                setPriority("Medium");
                                                setEventCategory("General");
                                                setEventDescription("");
                                                setEventColor("Default colour");
                                                setSelectedReminders([]);
                                            }}
                                            style={{ flex: 1, marginTop: 0 }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                                          {/* ADD ASSIGNMENT FORM */}
                        <div className="card">
                            <h3>{editingAssignId ? "Edit Assignment" : "Add Assignment"}</h3>
                            <form onSubmit={handleAddAssignment}>
                                <div className="input-group">
                                    <label>Assignment Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Homework, Project Report, etc." 
                                        value={assignName}
                                        onChange={e => setAssignName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Subject</label>
                                    <input 
                                        type="text" 
                                        placeholder="Mathematics, Physics, etc." 
                                        value={assignSubject}
                                        onChange={e => setAssignSubject(e.target.value)}
                                    />
                                </div>
                                <div className="input-group" style={{ position: "relative" }}>
                                    <label>Deadline Date</label>
                                    <input 
                                        type="text" 
                                        placeholder="Select deadline" 
                                        value={assignDeadline}
                                        onClick={() => {
                                            setShowAssignDatePicker(true);
                                            // Pre-fill calendar view with selected date if valid
                                            if (assignDeadline) {
                                                const dParsed = new Date(assignDeadline);
                                                if (!isNaN(dParsed.getTime())) {
                                                    setAssignPickerMonth(dParsed.getMonth());
                                                    setAssignPickerYear(dParsed.getFullYear());
                                                }
                                            }
                                        }}
                                        readOnly
                                        required
                                        style={{ cursor: "pointer" }}
                                    />
                                    {showAssignDatePicker && (
                                        <>
                                            <div 
                                                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: "transparent" }} 
                                                onClick={() => setShowAssignDatePicker(false)} 
                                            />
                                            <div className="custom-datepicker-popover" style={{ zIndex: 1000 }}>
                                                <div className="datepicker-header">
                                                    <button type="button" className="datepicker-month-btn" onClick={() => {
                                                        if (assignPickerMonth === 0) {
                                                            setAssignPickerMonth(11);
                                                            setAssignPickerYear(assignPickerYear - 1);
                                                        } else {
                                                            setAssignPickerMonth(assignPickerMonth - 1);
                                                        }
                                                    }}>‹</button>
                                                    <h3>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][assignPickerMonth]} {assignPickerYear}</h3>
                                                    <button type="button" className="datepicker-month-btn" onClick={() => {
                                                        if (assignPickerMonth === 11) {
                                                            setAssignPickerMonth(0);
                                                            setAssignPickerYear(assignPickerYear + 1);
                                                        } else {
                                                            setAssignPickerMonth(assignPickerMonth + 1);
                                                        }
                                                    }}>›</button>
                                                </div>
                                                <div className="datepicker-weekdays">
                                                    <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                                                </div>
                                                <div className="datepicker-grid">
                                                    {(() => {
                                                        const daysInMonth = new Date(assignPickerYear, assignPickerMonth + 1, 0).getDate();
                                                        const firstDayIndex = new Date(assignPickerYear, assignPickerMonth, 1).getDay();
                                                        const cells = [];
                                                        
                                                        // Previous month padding
                                                        for (let i = 0; i < firstDayIndex; i++) {
                                                            cells.push(<div key={`empty-${i}`} className="datepicker-day-cell empty"></div>);
                                                        }
                                                        
                                                        // Current month days
                                                        const todayStr = new Date().toISOString().split('T')[0];
                                                        for (let d = 1; d <= daysInMonth; d++) {
                                                            const mStr = (assignPickerMonth + 1).toString().padStart(2, '0');
                                                            const dStr = d.toString().padStart(2, '0');
                                                            const cellDateStr = `${assignPickerYear}-${mStr}-${dStr}`;
                                                            
                                                            const isPast = cellDateStr < todayStr;
                                                            const isSelected = assignDeadline === cellDateStr;
                                                            
                                                            cells.push(
                                                                <div key={`day-${d}`} className="datepicker-day-cell">
                                                                    <button
                                                                        type="button"
                                                                        disabled={isPast}
                                                                        className={`datepicker-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                                                                        onClick={() => {
                                                                            setAssignDeadline(cellDateStr);
                                                                            setShowAssignDatePicker(false);
                                                                        }}
                                                                    >
                                                                        {d}
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        return cells;
                                                    })()}
                                                </div>
                                                <div className="datepicker-shortcuts">
                                                    <button type="button" className="btn-secondary" style={{ marginTop: 0, fontSize: "11px", padding: "4px 8px" }} onClick={() => {
                                                        const todayS = new Date().toISOString().split('T')[0];
                                                        setAssignDeadline(todayS);
                                                        setAssignPickerMonth(new Date().getMonth());
                                                        setAssignPickerYear(new Date().getFullYear());
                                                        setShowAssignDatePicker(false);
                                                    }}>Today</button>
                                                    <button type="button" className="btn-secondary" style={{ marginTop: 0, fontSize: "11px", padding: "4px 8px" }} onClick={() => {
                                                        setAssignDeadline("");
                                                        setShowAssignDatePicker(false);
                                                    }}>Clear</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }}>
                                        {editingAssignId ? "Save Changes" : "Add Assignment"}
                                    </button>
                                    {editingAssignId && (
                                        <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            onClick={handleCancelEditAssignment}
                                            style={{ flex: 1, marginTop: 0 }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>              </div>
                    </div>
                )}


                {/* AI ASSISTANT VIEW */}
                {/* AI ASSISTANT VIEW (NEW STACKED HEADER) */}
                {activeTab === "ai" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%", animation: "fadeIn 0.3s ease-in-out" }}>
                        {/* AI HEADER WITH NAVIGATION BUTTONS */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>AI Assistant</h2>
                            {renderHeaderNavigation("ai")}
                        </div>

                        {/* Unified Professional Console */}
                        <div className={`ai-unified-console ${aiSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                            {/* LEFT SIDEBAR: Status & Smart Templates */}
                            <div className="ai-console-sidebar">
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px", height: "100%", maxHeight: "600px" }}>
                                    <button
                                        onClick={() => {
                                            setCurrentSessionId(null);
                                            setChatMessages([]);
                                            setAiQuestion("");
                                        }}
                                        style={{
                                            background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "8px",
                                            padding: "12px",
                                            fontSize: "14px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)"
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        New Chat
                                    </button>
                                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingRight: "4px" }}>
                                        <h4 style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", paddingLeft: "4px", marginBottom: "8px" }}>Recent Chats</h4>
                                        {chatSessions.length === 0 ? (
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "10px", textAlign: "center" }}>No previous chats</div>
                                        ) : (
                                            chatSessions.map(session => (
                                                <div 
                                                    key={session.id}
                                                    onClick={() => {
                                                        setCurrentSessionId(session.id);
                                                        setChatMessages(session.messages);
                                                    }}
                                                    style={{
                                                        padding: "10px",
                                                        borderRadius: "8px",
                                                        background: currentSessionId === session.id ? "rgba(139, 92, 246, 0.1)" : "transparent",
                                                        border: currentSessionId === session.id ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        transition: "all 0.2s ease",
                                                        marginBottom: "4px"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (currentSessionId !== session.id) e.currentTarget.style.background = "rgba(139, 92, 246, 0.05)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (currentSessionId !== session.id) e.currentTarget.style.background = "transparent";
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                        </svg>
                                                        <span style={{ fontSize: "13px", color: currentSessionId === session.id ? "var(--primary)" : "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: currentSessionId === session.id ? "700" : "500" }}>
                                                            {session.title}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newSessions = chatSessions.filter(s => s.id !== session.id);
                                                            setChatSessions(newSessions);
                                                            localStorage.setItem("smartTimetableChatSessions", JSON.stringify(newSessions));
                                                            if (currentSessionId === session.id) {
                                                                setCurrentSessionId(null);
                                                                setChatMessages([]);
                                                            }
                                                        }}
                                                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                        title="Delete Chat"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: Professional Conversational Sandbox */}
                            <div className="ai-console-chat">
                                {/* Chat Panel Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                        <button
                                            type="button"
                                            onClick={() => setAiSidebarCollapsed(!aiSidebarCollapsed)}
                                            title={aiSidebarCollapsed ? "Expand Settings" : "Collapse Settings"}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                color: "var(--text-muted)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: "6px",
                                                borderRadius: "6px",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="9" y1="3" x2="9" y2="21"/>
                                            </svg>
                                        </button>
                                        <div style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 4px 10px rgba(139, 92, 246, 0.2)"
                                        }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2a10 10 0 0 0-10 10c0 5.25 7 10 10 10s10-4.75 10-10A10 10 0 0 0 12 2z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "var(--text-main)" }}>AI Assistant Sandbox</h4>
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Instant schedule search and logic checking</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChatMessages([]);
                                            showToast("Conversation cleared", "success");
                                        }}
                                        style={{
                                            background: "rgba(239, 68, 68, 0.08)",
                                            border: "none",
                                            color: "#ef4444",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            fontSize: "11.5px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            transition: "background 0.2s"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"}
                                    >
                                        Clear Chat
                                    </button>
                                </div>

                                {/* Chat Viewport */}
                                <div className="ai-chat-viewport" style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    paddingRight: "10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "18px",
                                    marginBottom: "15px"
                                }}>
                                    {chatMessages.length === 0 ? (
                                        <div style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            justifyContent: "center", 
                                            alignItems: "center", 
                                            textAlign: "center",
                                            padding: "40px 10px",
                                            flex: 1
                                        }}>
                                            <h2 className="gemini-greeting" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                                Hello, {currentUser ? currentUser.split(" ")[0] : "Friend"}.
                                            </h2>
                                            <h3 className="gemini-subtitle">
                                                How can I help you today?
                                            </h3>
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "20px"
                                        }}>
                                            {chatMessages.map((msg, index) => {
                                                const isAI = msg.sender === "ai";
                                                return (
                                                    <div key={index} style={{
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        gap: "12px",
                                                        alignSelf: isAI ? "flex-start" : "flex-end",
                                                        maxWidth: "85%",
                                                        flexDirection: isAI ? "row" : "row-reverse"
                                                    }}>
                                                        {/* Avatar */}
                                                        <div style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "50%",
                                                            background: isAI ? "var(--primary-light)" : "var(--primary)",
                                                            color: isAI ? "var(--primary)" : "#ffffff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "12px",
                                                            fontWeight: "800",
                                                            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                                            flexShrink: 0
                                                        }}>
                                                            {isAI ? "AI" : (currentUser ? currentUser.charAt(0).toUpperCase() : "U")}
                                                        </div>

                                                        {/* Bubble */}
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: isAI ? "flex-start" : "flex-end" }}>
                                                            <div style={{
                                                                padding: "12px 16px",
                                                                borderRadius: isAI ? "0px 14px 14px 14px" : "14px 0px 14px 14px",
                                                                background: isAI ? "var(--surface)" : "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                                                                border: isAI ? "1px solid var(--border)" : "none",
                                                                color: isAI ? "var(--text-main)" : "#ffffff",
                                                                fontSize: "13.5px",
                                                                lineHeight: "1.5",
                                                                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                                                wordBreak: "break-word",
                                                                whiteSpace: "pre-line"
                                                            }}>
                                                                {isAI ? <MarkdownRenderer text={msg.text} /> : msg.text}
                                                            </div>
                                                            <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px", padding: "0 4px" }}>
                                                                {msg.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Typing status inside container */}
                                    {aiLoading && (
                                        <div style={chatMessages.length === 0 ? {} : {
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "20px"
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "12px",
                                                alignSelf: "flex-start",
                                                maxWidth: "85%"
                                            }}>
                                                <div style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "50%",
                                                    background: "var(--primary-light)",
                                                    color: "var(--primary)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "12px",
                                                    fontWeight: "800",
                                                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                                    flexShrink: 0
                                                }}>
                                                    AI
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                                    <div style={{
                                                        padding: "12px 18px",
                                                        borderRadius: "0px 14px 14px 14px",
                                                        background: "var(--surface)",
                                                        border: "1px solid var(--border)",
                                                        color: "var(--text-muted)",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                                                    }}>
                                                        <span className="ai-pulse-dot" style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", animation: "pulse 1.2s infinite" }}></span>
                                                        <span>Thinking & searching calendar...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef}></div>
                                </div>

                                {/* Floating Centered Input Pill */}
                                <div style={{
                                    width: "100%",
                                    padding: "10px 0 15px 0",
                                    position: "relative",
                                    background: "transparent"
                                }}>
                                    <form 
                                        onSubmit={(e) => handleAskAI(e)} 
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            background: activeTheme === "dark" ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
                                            border: activeTheme === "dark" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(139, 92, 246, 0.25)",
                                            borderRadius: "30px",
                                            padding: "6px 14px",
                                            boxShadow: "var(--shadow-sm)",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        <div style={{ position: "relative" }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowAiSettings(!showAiSettings)}
                                                style={{
                                                    background: "var(--surface)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "20px",
                                                    padding: "6px 12px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: "var(--text-main)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    whiteSpace: "nowrap",
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}
                                            >
                                                <span>
                                                    {aiEngine === "keyword" ? "Timon" : aiEngine === "pumba" ? "Pumba" : "Simba"}
                                                </span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAiSettings ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                </svg>
                                            </button>

                                            {showAiSettings && (
                                                <div style={{
                                                    position: "absolute",
                                                    bottom: "100%",
                                                    left: 0,
                                                    marginBottom: "12px",
                                                    background: "var(--surface)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "12px",
                                                    padding: "12px",
                                                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                                    width: "240px",
                                                    zIndex: 1000,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "12px",
                                                    animation: "fadeIn 0.2s ease"
                                                }}>
                                                     {/* Engine selection */}
                                                     <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                         <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>AI Engine</label>
                                                         <div className="custom-select-container" style={{ width: "100%", position: "relative" }}>
                                                             <div 
                                                                 className={`custom-select-trigger ${showAiEngineDropdown ? 'active' : ''}`}
                                                                 onClick={(e) => { e.stopPropagation(); setShowAiEngineDropdown(!showAiEngineDropdown); setShowAiModelDropdown(false); }}
                                                                 style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                                             >
                                                                 <span>{aiEngine === "keyword" ? "Timon (Standard)" : aiEngine === "pumba" ? "Pumba (Custom API Key)" : "Simba (Cloud)"}</span>
                                                                 <svg className="custom-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                     <polyline points="6 9 12 15 18 9"></polyline>
                                                                 </svg>
                                                             </div>
                                                             {showAiEngineDropdown && (
                                                                 <ul className="custom-select-options" style={{ top: "100%", left: 0, right: 0, position: "absolute", zIndex: 100, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "4px", padding: 0, listStyle: "none", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
                                                                     {[
                                                                         { value: "keyword", label: "Timon (Standard)" },
                                                                         { value: "pumba", label: "Pumba (Custom API Key)" },
                                                                         { value: "openrouter", label: "Simba (Cloud)" }
                                                                     ].map(item => (
                                                                         <li 
                                                                             key={item.value}
                                                                             className={`custom-select-option ${aiEngine === item.value ? 'selected' : ''}`}
                                                                             onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 const eng = item.value;
                                                                                 setAiEngine(eng);
                                                                                 localStorage.setItem("aiEngine", eng);
                                                                                 let defModel = "";
                                                                                 if (eng === "openrouter" || eng === "pumba") defModel = "openrouter/free";
                                                                                 setAiModel(defModel);
                                                                                 localStorage.setItem("aiModel", defModel);
                                                                                 saveAiSettings(eng, defModel, openrouterKey, huggingfaceToken);
                                                                                 setShowAiEngineDropdown(false);
                                                                             }}
                                                                             style={{ padding: "8px", fontSize: "12px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: aiEngine === item.value ? "var(--border)" : "transparent", color: "var(--text-main)" }}
                                                                             onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                                                                             onMouseLeave={(e) => { if(aiEngine !== item.value) e.currentTarget.style.background = "transparent"; }}
                                                                         >
                                                                             {item.label}
                                                                         </li>
                                                                     ))}
                                                                 </ul>
                                                             )}
                                                         </div>
                                                     </div>
                                                     
                                                     {/* Pumba custom key input */}
                                                     {aiEngine === "pumba" && (
                                                         <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                             <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>API Key</label>
                                                             <input
                                                                 type="password"
                                                                 placeholder="Paste key (optional)"
                                                                 value={openrouterKey}
                                                                 onChange={(e) => {
                                                                     setOpenrouterKey(e.target.value);
                                                                     localStorage.setItem("openrouterKey", e.target.value);
                                                                 }}
                                                                 onBlur={() => saveAiSettings(aiEngine, aiModel, openrouterKey, huggingfaceToken)}
                                                                 style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-main)", fontSize: "12px", outline: "none" }}
                                                             />
                                                         </div>
                                                     )}

                                                     {/* Simba Model selection */}
                                                     {aiEngine !== "keyword" && (
                                                         <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                             <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>Model</label>
                                                             <div className="custom-select-container" style={{ width: "100%", position: "relative" }}>
                                                                 <div 
                                                                     className={`custom-select-trigger ${showAiModelDropdown ? 'active' : ''}`}
                                                                     onClick={(e) => { e.stopPropagation(); setShowAiModelDropdown(!showAiModelDropdown); setShowAiEngineDropdown(false); }}
                                                                     style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                                                 >
                                                                     <span>{
                                                                         aiModel === "meta-llama/llama-3.3-70b-instruct:free" ? "Llama 3.3 70B" :
                                                                         aiModel === "google/gemma-4-31b-it:free" ? "Gemma 4 31B" :
                                                                         aiModel === "mistralai/mistral-7b-instruct:free" ? "Mistral 7B" :
                                                                         aiModel === "microsoft/phi-3-medium-128k-instruct:free" ? "Phi-3 Medium" :
                                                                         "Auto-Select Free Model"
                                                                     }</span>
                                                                     <svg className="custom-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                         <polyline points="6 9 12 15 18 9"></polyline>
                                                                     </svg>
                                                                 </div>
                                                                 {showAiModelDropdown && (
                                                                     <ul className="custom-select-options" style={{ top: "100%", left: 0, right: 0, position: "absolute", zIndex: 100, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "4px", padding: 0, listStyle: "none", boxShadow: "var(--shadow-md)", overflow: "hidden", maxHeight: "200px", overflowY: "auto" }}>
                                                                         {[
                                                                             { value: "openrouter/free", label: "Auto-Select Free Model" },
                                                                             { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B" },
                                                                             { value: "google/gemma-4-31b-it:free", label: "Gemma 4 31B" },
                                                                             { value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B" },
                                                                             { value: "microsoft/phi-3-medium-128k-instruct:free", label: "Phi-3 Medium" }
                                                                         ].map(item => (
                                                                             <li 
                                                                                 key={item.value}
                                                                                 className={`custom-select-option ${aiModel === item.value ? 'selected' : ''}`}
                                                                                 onClick={(e) => {
                                                                                     e.stopPropagation();
                                                                                     setAiModel(item.value);
                                                                                     localStorage.setItem("aiModel", item.value);
                                                                                     saveAiSettings(aiEngine, item.value, openrouterKey, huggingfaceToken);
                                                                                     setShowAiModelDropdown(false);
                                                                                 }}
                                                                                 style={{ padding: "8px", fontSize: "12px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: aiModel === item.value ? "var(--border)" : "transparent", color: "var(--text-main)" }}
                                                                                 onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                                                                                 onMouseLeave={(e) => { if(aiModel !== item.value) e.currentTarget.style.background = "transparent"; }}
                                                                             >
                                                                                 {item.label}
                                                                             </li>
                                                                         ))}
                                                                     </ul>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     )}
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Ask AI Assistant about slots, schedules, or tasks..."
                                            value={aiQuestion}
                                            onChange={(e) => setAiQuestion(e.target.value)}
                                            required
                                            disabled={aiLoading}
                                            style={{
                                                flex: 1,
                                                width: "auto",
                                                background: "transparent",
                                                border: "none",
                                                outline: "none",
                                                boxShadow: "none",
                                                color: "var(--text-main)",
                                                fontSize: "14.5px",
                                                padding: "8px 4px",
                                                fontFamily: "var(--font-family)"
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={aiLoading || !aiQuestion.trim()}
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "50%",
                                                background: "var(--primary)",
                                                border: "none",
                                                color: "#ffffff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                                                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.2)",
                                                flexShrink: 0
                                            }}
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{
                                                    transform: "rotate(45deg) translate(-1px, 1px)",
                                                    transition: "all 0.3s",
                                                    animation: aiLoading ? "spin 1.5s linear infinite" : "none"
                                                }}
                                            >
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACCOUNT PROFILE VIEW (FULL-PAGE LUXURIOUS GRID) */}
                {activeTab === "account" && (
                    <div className="card full-page-card" style={{ padding: "40px 30px" }}>
                        {/* Profile Header */}
                        <div style={{ margin: "15px 0 25px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <div style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                background: "var(--primary)",
                                color: "#ffffff",
                                fontSize: "32px",
                                fontWeight: "800",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 15px",
                                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.25)"
                            }}>
                                {currentUser ? currentUser.charAt(0).toUpperCase() : "A"}
                            </div>
                            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", marginBottom: "6px" }}>Workspace Account Profile</h2>
                            <p style={{ fontSize: "14.5px", color: "var(--text-muted)", margin: 0 }}>View and manage your smart workspace and synchronization credentials.</p>
                        </div>

                        {/* Premium Grid Profile Layout */}
                        <div className="profile-details-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "20px" }}>
                            <div className="profile-detail-card">
                                <label>Full Name</label>
                                <span>{currentUser || "Administrator"}</span>
                            </div>
                            <div className="profile-detail-card">
                                <label>Email Address</label>
                                <span>{email || "admin@smarttimetable.com"}</span>
                            </div>
                            <div className="profile-detail-card">
                                <label>Date of Birth</label>
                                <span>{dob || "N/A"}</span>
                            </div>
                            <div className="profile-detail-card">
                                <label>Gender</label>
                                <span>{gender || "N/A"}</span>
                            </div>
                            <div className="profile-detail-card">
                                <label>Calculated Age</label>
                                <span>{age || "N/A"}</span>
                            </div>
                            <div className="profile-detail-card">
                                <label>Workspace Status</label>
                                <span style={{ color: googleConnected ? "var(--primary)" : "var(--text-muted)" }}>
                                    {googleConnected ? " Connected with Google" : " Local Account"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {/* SETTINGS VIEW (APPEARANCE & SECURITY STACKED VERTICALLY IN THE SAME WORKSPACE) */}
                {activeTab === "settings" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                        {/* WORKSPACE SETTINGS HEADER */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>Workspace Settings</h2>
                        </div>

                        {/* APPEARANCE SETTINGS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', color: 'var(--primary)' }}>
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.03743 19.1789 5.09341 19.4443 4.99676 19.6806C4.83965 20.0649 4.75 20.4851 4.75 20.9231C4.75 21.5179 5.23214 22 5.82692 22H12Z"></path>
                                    <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"></circle>
                                    <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"></circle>
                                    <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"></circle>
                                    <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"></circle>
                                </svg>
                                Appearance Settings
                            </h3>
                            <div className="card full-page-card" style={{ padding: "30px", marginTop: 0 }}>
                                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginBottom: "20px" }}>Switch between vibrant light mode and optimized slate dark mode.</p>
                                <div style={{ display: "flex", gap: "12px", maxWidth: "400px" }}>
                                    <button 
                                        onClick={() => handleApplyTheme("light")}
                                        style={{ 
                                            padding: "12px 20px", 
                                            borderRadius: "20px", 
                                            fontSize: "13.5px", 
                                            fontWeight: "700", 
                                            cursor: "pointer",
                                            border: activeTheme === "light" ? "2px solid var(--primary)" : "1px solid var(--border)",
                                            background: activeTheme === "light" ? "var(--primary-light)" : "transparent",
                                            color: activeTheme === "light" ? "var(--primary)" : "var(--text-muted)",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flex: 1,
                                            justifyContent: "center",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="5"></circle>
                                            <line x1="12" y1="1" x2="12" y2="3"></line>
                                            <line x1="12" y1="21" x2="12" y2="23"></line>
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                            <line x1="1" y1="12" x2="3" y2="12"></line>
                                            <line x1="21" y1="12" x2="23" y2="12"></line>
                                            <line x1="4.22" y1="19.07" x2="5.64" y2="17.64"></line>
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                        </svg>
                                        Light Mode
                                    </button>
                                    <button 
                                        onClick={() => handleApplyTheme("dark")}
                                        style={{ 
                                            padding: "12px 20px", 
                                            borderRadius: "20px", 
                                            fontSize: "13.5px", 
                                            fontWeight: "700", 
                                            cursor: "pointer",
                                            border: activeTheme === "dark" ? "2px solid var(--primary)" : "1px solid var(--border)",
                                            background: activeTheme === "dark" ? "rgba(167, 139, 250, 0.15)" : "transparent",
                                            color: activeTheme === "dark" ? "var(--primary)" : "var(--text-muted)",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flex: 1,
                                            justifyContent: "center",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                        </svg>
                                        Dark Mode
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* SECURITY SETTINGS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', color: 'var(--primary)' }}>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Security Settings
                            </h3>
                            <div className="card full-page-card" style={{ padding: "30px", marginTop: 0 }}>
                                <div style={{ marginBottom: "25px" }}>
                                    <h5 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 8px 0" }}>Reset Password</h5>
                                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px 0" }}>Update your password credentials to secure your calendar data.</p>
                                    <form onSubmit={handleSettingsResetPassword} style={{ display: "flex", gap: "10px", marginBottom: "10px", maxWidth: "450px" }}>
                                        <input 
                                            type="password" 
                                            placeholder="Enter new password" 
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            style={{ 
                                                flex: 1, 
                                                padding: "10px 12px", 
                                                borderRadius: "8px", 
                                                border: "1px solid var(--border)",
                                                fontSize: "13px",
                                                background: "var(--surface)",
                                                color: "var(--text-main)"
                                            }}
                                            required
                                        />
                                        <button type="submit" className="btn-primary" style={{ padding: "0 18px", fontSize: "13px", width: "auto", marginTop: 0 }}>
                                            Update
                                        </button>
                                    </form>
                                </div>

                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginTop: "20px" }}>
                                    <h5 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 8px 0" }}>Account Session & Deletion</h5>
                                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 15px 0" }}>Manage account session states and destructive workspace deletions.</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
                                        <button 
                                            onClick={handleDeleteAccount}
                                            style={{ 
                                                padding: "12px", 
                                                borderRadius: "8px", 
                                                border: "1px solid #ef4444", 
                                                background: "rgba(239, 68, 68, 0.08)", 
                                                color: "#ef4444", 
                                                fontSize: "13px", 
                                                fontWeight: "700", 
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                            Delete Workspace Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ANALYTICS VIEW (NEW!) */}
                {activeTab === "analytics" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>Analytics</h2>
                            {renderHeaderNavigation("analytics")}
                        </div>

                        <div className="card full-page-card animate-fade-in" style={{ padding: "40px 30px" }}>
                            <div style={{ marginBottom: "35px" }}>
                                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>Workspace Performance Analytics</h3>
                                <p style={{ fontSize: "14.5px", color: "var(--text-muted)", margin: 0 }}>Understand your productivity patterns, task focus, and schedule allocation.</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="analytics-grid">
                                <div className="analytics-card">
                                    <div className="analytics-card-header">
                                        <span>Total Scheduled Events</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="stat-num">{analyticsData?.summary?.totalEvents ?? events.length}</div>
                                    <div className="stat-label">Active sync slots</div>
                                </div>

                                <div className="analytics-card">
                                    <div className="analytics-card-header">
                                        <span>Pending Assignments</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#f59e0b" }}>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </div>
                                    <div className="stat-num">{analyticsData?.summary?.totalAssignments ?? assignments.length}</div>
                                    <div className="stat-label">Tasks awaiting completion</div>
                                </div>

                                <div className="analytics-card">
                                    <div className="analytics-card-header">
                                        <span>Productivity Score</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10b981" }}>
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="stat-num">
                                        {analyticsData?.summary?.productivity ?? (events.length ? Math.min(100, Math.round(events.length * 8 + assignments.length * 12)) : 0)}
                                    </div>
                                    <div className="stat-label">Calculated rating index</div>
                                </div>
                            </div>

                            {analyticsLoading ? (
                                <div style={{ padding: "80px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px" }}>
                                    <span style={{ fontSize: "32px", animation: "spin 2s linear infinite", display: "inline-block" }}></span>
                                    <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "600" }}>Loading performance charts...</span>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                                    {/* 2x2 Charts Grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "25px" }}>
                                        {/* Chart 1: Event Categories */}
                                        <div className="card" style={{ padding: "24px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column" }}>
                                            <h4 style={{ margin: "0 0 15px", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>Event Category Distribution</h4>
                                            <div style={{ height: "260px", position: "relative" }}>
                                                <canvas ref={eventCategoriesChartRef} />
                                            </div>
                                        </div>

                                        {/* Chart 2: Event Priorities */}
                                        <div className="card" style={{ padding: "24px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column" }}>
                                            <h4 style={{ margin: "0 0 15px", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>Calendar Priority Allocation</h4>
                                            <div style={{ height: "260px", position: "relative" }}>
                                                <canvas ref={eventPriorityChartRef} />
                                            </div>
                                        </div>

                                        {/* Chart 3: Assignment Urgency */}
                                        <div className="card" style={{ padding: "24px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column" }}>
                                            <h4 style={{ margin: "0 0 15px", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>Assignment Urgency Status</h4>
                                            <div style={{ height: "260px", position: "relative" }}>
                                                <canvas ref={assignmentUrgencyChartRef} />
                                            </div>
                                        </div>

                                        {/* Chart 4: Goal Completion */}
                                        <div className="card" style={{ padding: "24px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column" }}>
                                            <h4 style={{ margin: "0 0 15px", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>Goals Completion Progress</h4>
                                            <div style={{ height: "260px", position: "relative" }}>
                                                <canvas ref={goalProgressChartRef} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming Deadlines alerts */}
                                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.01)" }}>
                                        <h4 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: "800", color: "var(--text-main)" }}>Upcoming Deadline Alerts</h4>
                                        {!analyticsData?.upcomingDeadlines || analyticsData.upcomingDeadlines.length === 0 ? (
                                            <div style={{ color: "var(--text-muted)", fontSize: "14.5px", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                                                 All caught up! No assignments due within the next 7 days.
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {analyticsData.upcomingDeadlines.map((deadline) => {
                                                    const isUrgent = deadline.status === "urgent";
                                                    const alertBg = isUrgent ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)";
                                                    const alertBorder = isUrgent ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)";
                                                    const badgeBg = isUrgent ? "#ef4444" : "#f59e0b";
                                                    
                                                    return (
                                                        <div 
                                                            key={deadline.id} 
                                                            style={{ 
                                                                display: "flex", 
                                                                justifyContent: "space-between", 
                                                                alignItems: "center", 
                                                                padding: "16px 20px", 
                                                                borderRadius: "10px", 
                                                                background: alertBg, 
                                                                border: alertBorder,
                                                                animation: "fadeIn 0.25s ease forwards"
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                                <span style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "14.5px" }}>{deadline.name}</span>
                                                                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Subject: {deadline.subject || "General"}</span>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                                                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Due: {deadline.deadline}</span>
                                                                <span 
                                                                    style={{ 
                                                                        padding: "6px 12px", 
                                                                        borderRadius: "6px", 
                                                                        color: "#ffffff", 
                                                                        fontSize: "12px", 
                                                                        fontWeight: "800",
                                                                        background: badgeBg
                                                                    }}
                                                                >
                                                                    {deadline.daysLeft < 0 ? "Overdue" : deadline.daysLeft === 0 ? "Due Today" : deadline.daysLeft === 1 ? "Due Tomorrow" : `${deadline.daysLeft} days left`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AI SCHEDULER VIEW (NEW!) */}
                {activeTab === "ai-scheduler" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>AI Scheduler</h2>
                            {renderHeaderNavigation("ai-scheduler")}
                        </div>

                        <div className="card full-page-card animate-fade-in" style={{ padding: "40px 30px" }}>
                            <div style={{ marginBottom: "35px" }}>
                                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>AI study schedule generator</h3>
                                <p style={{ fontSize: "14.5px", color: "var(--text-muted)", margin: 0 }}>Generate a personalized, day-by-day study timetable utilizing artificial intelligence aligned with your database context.</p>
                            </div>

                            {/* Stats Bar */}
                            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "30px" }}>
                                <div style={{ flex: 1, minWidth: "150px", padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "24px" }}></span>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Events Context</div>
                                        <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)" }}>{events.length} loaded</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: "150px", padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "24px" }}></span>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Assignments Context</div>
                                        <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)" }}>{assignments.length} active</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: "150px", padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "24px" }}></span>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Active Engine</div>
                                        <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", textTransform: "capitalize" }}>{aiEngine}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Parameter Settings */}
                            <div className="grid-2-col" style={{ gap: "25px", marginBottom: "35px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <label style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>Schedule Duration</label>
                                            <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--primary)" }}>{scheduleDuration} Days</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="30" 
                                            value={scheduleDuration} 
                                            onChange={(e) => setScheduleDuration(parseInt(e.target.value))}
                                            style={{
                                                width: "100%",
                                                accentColor: "var(--primary)",
                                                cursor: "pointer",
                                                height: "6px",
                                                borderRadius: "3px"
                                            }}
                                        />
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                            <span>1 day</span>
                                            <span>15 days</span>
                                            <span>30 days</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <label style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>Daily Study Hours Target</label>
                                            <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--primary)" }}>{scheduleStudyHours} Hours</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="12" 
                                            value={scheduleStudyHours} 
                                            onChange={(e) => setScheduleStudyHours(parseInt(e.target.value))}
                                            style={{
                                                width: "100%",
                                                accentColor: "var(--primary)",
                                                cursor: "pointer",
                                                height: "6px",
                                                borderRadius: "3px"
                                            }}
                                        />
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                            <span>1 hour</span>
                                            <span>6 hours</span>
                                            <span>12 hours</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>Schedule Focus Type</label>
                                        <div className="custom-select-container" style={{ width: "100%" }}>
                                            <div 
                                                className={`custom-select-trigger ${showScheduleTypeDropdown ? 'active' : ''}`}
                                                onClick={() => setShowScheduleTypeDropdown(!showScheduleTypeDropdown)}
                                                style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-main)", fontSize: "14.5px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                            >
                                                <span>{scheduleType}</span>
                                                <svg className="custom-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>
                                            {showScheduleTypeDropdown && (
                                                <ul className="custom-select-options" style={{ top: "100%", left: 0, right: 0, position: "absolute", zIndex: 100, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "4px", padding: 0, listStyle: "none", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
                                                    {["Balanced Study Plan", "Exam Preparation", "Assignment Focus", "Productivity Boost", "Weekend Planner"].map(val => (
                                                        <li 
                                                            key={val}
                                                            className={`custom-select-option ${scheduleType === val ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setScheduleType(val);
                                                                setShowScheduleTypeDropdown(false);
                                                            }}
                                                            style={{ padding: "12px 16px", fontSize: "14.5px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: scheduleType === val ? "var(--border)" : "transparent" }}
                                                        >
                                                            {val}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>Intensity Level</label>
                                        <div className="custom-select-container" style={{ width: "100%" }}>
                                            <div 
                                                className={`custom-select-trigger ${showScheduleIntensityDropdown ? 'active' : ''}`}
                                                onClick={() => setShowScheduleIntensityDropdown(!showScheduleIntensityDropdown)}
                                                style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-main)", fontSize: "14.5px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                            >
                                                <span>{scheduleIntensity === "Light" ? "Light Focus" : scheduleIntensity === "Moderate" ? "Moderate Study" : "Intensive Bootcamp"}</span>
                                                <svg className="custom-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>
                                            {showScheduleIntensityDropdown && (
                                                <ul className="custom-select-options" style={{ top: "100%", left: 0, right: 0, position: "absolute", zIndex: 100, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "4px", padding: 0, listStyle: "none", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
                                                    {[
                                                        { value: "Light", label: "Light Focus" },
                                                        { value: "Moderate", label: "Moderate Study" },
                                                        { value: "Intensive", label: "Intensive Bootcamp" }
                                                    ].map(item => (
                                                        <li 
                                                            key={item.value}
                                                            className={`custom-select-option ${scheduleIntensity === item.value ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setScheduleIntensity(item.value);
                                                                setShowScheduleIntensityDropdown(false);
                                                            }}
                                                            style={{ padding: "12px 16px", fontSize: "14.5px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: scheduleIntensity === item.value ? "var(--border)" : "transparent" }}
                                                        >
                                                            {item.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions and Quick Templates */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", borderTop: "1px solid var(--border)", paddingTop: "25px", marginBottom: "35px" }}>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>Templates:</span>
                                    <button onClick={() => triggerQuickPlanner("exam")} className="btn-secondary" style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px" }}>Exam prep</button>
                                    <button onClick={() => triggerQuickPlanner("assignment")} className="btn-secondary" style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px" }}>Assignment focus</button>
                                    <button onClick={() => triggerQuickPlanner("goal")} className="btn-secondary" style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px" }}>Goal planner</button>
                                </div>
                                <button 
                                    onClick={handleGenerateSchedule} 
                                    className="btn-primary" 
                                    disabled={schedulerLoading}
                                    style={{ 
                                        padding: "14px 28px", 
                                        borderRadius: "10px", 
                                        fontSize: "15px", 
                                        fontWeight: "800", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "10px" 
                                    }}
                                >
                                    {schedulerLoading && <span className="loader-spinner" />}
                                    {schedulerLoading ? "Generating Schedule..." : "Generate AI Schedule"}
                                </button>
                            </div>

                            {/* Result Area */}
                            {(schedulerLoading || generatedSchedule) && (
                                <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: "30px", animation: "fadeIn 0.3s ease-in-out" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                        <h4 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span></span> Generated Study Schedule
                                        </h4>
                                        {generatedSchedule && (
                                            <button 
                                                onClick={() => {
                                                    const blob = new Blob([generatedSchedule], { type: "text/plain;charset=utf-8" });
                                                    const link = document.createElement("a");
                                                    link.href = URL.createObjectURL(blob);
                                                    link.download = "AI_Schedule.txt";
                                                    link.click();
                                                    showToast("Downloaded schedule as AI_Schedule.txt", "success");
                                                }}
                                                className="btn-secondary"
                                                style={{ 
                                                    padding: "8px 14px", 
                                                    borderRadius: "8px", 
                                                    fontSize: "13px", 
                                                    fontWeight: "700",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                 Download Schedule (.txt)
                                            </button>
                                        )}
                                    </div>

                                    {schedulerLoading ? (
                                        <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px", border: "1px dashed var(--border)", borderRadius: "12px", background: "rgba(255,255,255,0.01)" }}>
                                            <span style={{ fontSize: "32px", animation: "spin 2s linear infinite", display: "inline-block" }}></span>
                                            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "600" }}>Synthesizing schedule parameters and querying AI engine...</span>
                                        </div>
                                    ) : (
                                        <div className="reply-box animate-fade-in" style={{ padding: "25px 30px", borderRadius: "12px", border: "1.5px solid var(--border)", background: "rgba(0,0,0,0.08)", overflowY: "auto", maxHeight: "500px" }}>
                                            <MarkdownRenderer text={generatedSchedule} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            {/* FAQ ACCORDION VIEW (NEW!) */}
                {activeTab === "faq" && (
                    <div className="card full-page-card animate-fade-in" style={{ padding: "40px 30px" }}>
                        <div style={{ marginBottom: "35px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>Frequently Asked Questions</h2>
                            <p style={{ fontSize: "14.5px", color: "var(--text-muted)", margin: 0 }}>Find quick answers about scheduling, Google Calendar synchronization, and features.</p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {[
                                {
                                    q: "How does Google Calendar synchronization work?",
                                    a: "Smart Timetable AI integrates securely with Google Calendar using official OAuth 2.0 credentials. When you connect, any events you schedule, update, or delete are immediately pushed to your primary Google Calendar in real-time. Similarly, click the Refresh buttons to pull the latest calendar updates."
                                },
                                {
                                    q: "How do the custom event theme colors work?",
                                    a: "We support the 11 official Google Calendar theme colors (such as Blueberry, Lavender, Grape, Tomato, etc.) plus a default color. When you select a theme color, it is mapped to Google's calendar colorId API parameters, aligning your custom timetable visual layout perfectly with official calendar platforms."
                                },
                                {
                                    q: "Can I set multiple notifications or reminders?",
                                    a: "Yes! You can configure up to 3 separate reminder offsets per event (in minutes, hours, or days). Our system runs a background scheduler that monitors your upcoming events and fires rich glassmorphic Toast alerts starting at your configured offsets, plus a direct notification when the event begins."
                                },
                                {
                                    q: "Why are past events or schedules restricted?",
                                    a: "To maintain the integrity of your dynamic timetable, we enforce progressive scheduling. Restricting past event creation ensures that your calendar remains a forward-looking action plan for productivity and avoids conflicting back-dated entries."
                                },
                                {
                                    q: "Where is my calendar and profile data saved?",
                                    a: "All active calendar entries and account settings are securely stored in MongoDB Atlas Cloud database nodes. If the cloud database is ever unreachable, the application automatically switches to a high-speed local memory fallback cache to keep your timetable active."
                                }
                            ].map((item, idx) => {
                                const isOpen = faqOpenIndex === idx;
                                return (
                                    <div key={idx} className="faq-item" style={{ border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface)", overflow: "hidden", transition: "all 0.3s" }}>
                                        <button 
                                            onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                                            style={{ 
                                                width: "100%", 
                                                padding: "20px 24px", 
                                                display: "flex", 
                                                justifyContent: "space-between", 
                                                alignItems: "center", 
                                                background: "transparent", 
                                                border: "none", 
                                                color: "var(--text-main)", 
                                                fontSize: "15.5px", 
                                                fontWeight: "700", 
                                                textAlign: "left",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <span>{item.q}</span>
                                            <span style={{ fontSize: "12px", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}></span>
                                        </button>
                                        <div style={{ 
                                            maxHeight: isOpen ? "200px" : "0", 
                                            opacity: isOpen ? 1 : 0, 
                                            padding: isOpen ? "0 24px 24px" : "0 24px",
                                            fontSize: "14px", 
                                            color: "var(--text-muted)", 
                                            lineHeight: "1.6",
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            borderTop: isOpen ? "1.5px solid var(--border)" : "1.5px solid transparent",
                                            paddingTop: isOpen ? "16px" : 0
                                        }}>
                                            {item.a}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ABOUT VIEW (NEW!) */}
                {activeTab === "about" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%" }}>
                        {/* ABOUT HEADER */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>About</h2>
                        </div>

                        <div className="card full-page-card animate-fade-in" style={{ padding: "40px 30px", marginTop: 0 }}>
                            <div style={{ textAlign: "center", marginBottom: "40px", borderBottom: "1.5px solid var(--border)", paddingBottom: "30px" }}>
                                <div style={{ fontSize: "48px", fontWeight: "900", marginBottom: "10px" }}>
                                    Smart Timetable {renderAIHighlight("AI")}
                                </div>
                                <div style={{ fontSize: "14px", color: "var(--primary)", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                                    Version 2.0.0 Pro Edition
                                </div>
                            </div>

                            <div className="grid-2-col" style={{ gap: "30px" }}>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "15px", color: "var(--text-main)" }}>Intelligent Time Optimization</h3>
                                    <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.7", marginBottom: "15px" }}>
                                        Smart Timetable AI is a state-of-the-art schedule management system built for high-performance planners. Combining a high-speed React dashboard, Flask web servers, and artificial intelligence, the application streamlines calendar entries, provides robust assignment tracking, and dynamically detects free space for self-organization.
                                    </p>
                                    <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.7" }}>
                                        Integrate your workflow natively with Google Calendar, customize visual identities, and leverage natural language processing via the integrated AI Assistant.
                                    </p>
                                </div>

                                <div className="card" style={{ padding: "24px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.02)" }}>
                                    <h4 style={{ margin: "0 0 15px", fontSize: "15px", fontWeight: "800" }}>Technology Stack</h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>Frontend Client:</span>
                                            <span style={{ fontWeight: "700" }}>React JSX & Vanilla CSS</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>Backend Framework:</span>
                                            <span style={{ fontWeight: "700" }}>Python Flask (RESTful API)</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>Cloud Database:</span>
                                            <span style={{ fontWeight: "700" }}>MongoDB Atlas Cloud</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>Synchronization:</span>
                                            <span style={{ fontWeight: "700" }}>Google Calendar API v3</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>Authorization Protocol:</span>
                                            <span style={{ fontWeight: "700" }}>OAuth 2.0 & OpenID</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DEVELOPER INFO SECTION (OUTSIDE ABOUT BOX) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", marginBottom: "5px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-1px" }}>Developer Info</h2>
                        </div>

                        <div className="card full-page-card animate-fade-in" style={{ padding: "40px 30px", marginTop: 0 }}>
                            <p style={{ fontSize: "14.5px", color: "var(--text-muted)", margin: "0 0 25px 0" }}>
                                The innovative engineering team from <strong>Anil Neerukonda Institute of Technology & Sciences (ANITS)</strong> behind Smart Timetable AI.
                            </p>
                            
                            <div className="grid-2-col" style={{ gap: "25px", marginTop: 0 }}>
                                {/* Dolai Vidya */}
                                <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.01)" }}>
                                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "22px" }}>
                                        DV
                                    </div>
                                    <div>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "800", color: "var(--text-main)" }}>Dolai Vidya</h4>
                                        <div style={{ fontSize: "13.5px", color: "var(--primary)", fontWeight: "700", marginBottom: "4px" }}>Chief Software Architect & Lead Developer</div>
                                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>ANITS Computer Science and Engineering</span>
                                    </div>
                                </div>

                                {/* Eadala Ramya */}
                                <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.01)" }}>
                                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "22px" }}>
                                        ER
                                    </div>
                                    <div>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>Eadala Ramya</h4>
                                        <div style={{ fontSize: "13.5px", color: "var(--text-main)", fontWeight: "600", marginBottom: "4px" }}>UI/UX Architect & Frontend Developer</div>
                                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>ANITS Computer Science and Engineering</span>
                                    </div>
                                </div>

                                {/* K.S.Vardhan */}
                                <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.01)" }}>
                                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "22px" }}>
                                        KV
                                    </div>
                                    <div>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>K.S.Vardhan</h4>
                                        <div style={{ fontSize: "13.5px", color: "var(--text-main)", fontWeight: "600", marginBottom: "4px" }}>Full Stack Developer & Integration Lead</div>
                                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>ANITS Computer Science and Engineering</span>
                                    </div>
                                </div>

                                {/* M.Venu Madhav */}
                                <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.01)" }}>
                                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "22px" }}>
                                        VM
                                    </div>
                                    <div>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>M.Venu Madhav</h4>
                                        <div style={{ fontSize: "13.5px", color: "var(--text-main)", fontWeight: "600", marginBottom: "4px" }}>AI/ML Developer & Database Engineer</div>
                                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>ANITS Computer Science and Engineering</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                            © 2026 Smart Timetable AI Inc. All rights reserved. Designed for maximum utility and visual excellence.
                        </div>
                    </div>
                )}
            </div>


            {/* Custom Toast Notifications */}
            <div className="toast-container">

                {toasts.map(t => (
                    <div key={t.id} className={`toast-notification toast-${t.type}`}>
                        <span className="toast-message">{t.message}</span>
                        <button 
                            className="toast-close-btn" 
                            type="button"
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Mount React application to DOM
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
