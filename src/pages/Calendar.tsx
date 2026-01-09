import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MODULES, NETWORK_CONFIG, MODULE_ADDRESS } from '../constants/contracts';
import './Calendar.css';

interface CalendarProps {
    walletConnected: boolean;
}




const GENRE_OPTIONS = ['AMA', 'Community', 'Arts', 'Tech', 'NFT', 'Meme', 'Defi', 'Gaming'];

interface BlockchainEvent {
    creator: string;
    name: string;
    start_time: string;
    end_time: string;
    date: string;
    banner_uri: string;
    genres: string[];
    space_link: string;
}

function Calendar({ walletConnected }: CalendarProps) {
    const { signAndSubmitTransaction, account } = useWallet();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [events, setEvents] = useState<BlockchainEvent[]>([]);

    // Cache for creator profiles - key: address, value: {username, pfp}
    const [creatorProfiles, setCreatorProfiles] = useState<Record<string, { username: string, pfp: string }>>({});

    const [formData, setFormData] = useState<{
        eventName: string;
        eventDate: string;
        startTime: string;
        endTime: string;
        bannerUri: string;
        genres: string[];
        spaceLink: string;
    }>({
        eventName: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        bannerUri: '',
        genres: [],
        spaceLink: ''
    });

    const handleGenreToggle = (genre: string) => {
        setFormData(prev => {
            if (prev.genres.includes(genre)) {
                return { ...prev, genres: prev.genres.filter(g => g !== genre) };
            } else {
                if (prev.genres.length >= 3) return prev; // Max 3 limitation
                return { ...prev, genres: [...prev.genres, genre] };
            }
        });
    };

    // Filter State
    const [filterState, setFilterState] = useState({
        allEvents: true,
        myEvents: false,
        upcoming: false,
    });
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

    const handleFilterChange = (key: keyof typeof filterState) => {
        setFilterState(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenreFilterToggle = (genre: string) => {
        setSelectedGenres(prev => {
            if (prev.includes(genre)) {
                return prev.filter(g => g !== genre);
            } else {
                return [...prev, genre];
            }
        });
    };



    // Selected date for filtering events
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Initialization State
    const [isSpaceInitialized, setIsSpaceInitialized] = useState(false);

    // POAP State
    const [poapStatus, setPoapStatus] = useState<Record<string, { exists: boolean, minted: boolean, isPaused: boolean }>>({});
    const [showCreatePoapModal, setShowCreatePoapModal] = useState(false);
    const [showMintPoapModal, setShowMintPoapModal] = useState(false);
    const [selectedEventForPoap, setSelectedEventForPoap] = useState<BlockchainEvent | null>(null);
    const [poapFormData, setPoapFormData] = useState({
        description: '',
        uri: '',
        maxSupply: '100',
        password: '',
    });
    const [mintPassword, setMintPassword] = useState('');

    // Holders Modal State
    const [showHoldersModal, setShowHoldersModal] = useState(false);
    const [currentHolders, setCurrentHolders] = useState<string[]>([]);
    const [holdersLoading, setHoldersLoading] = useState(false);

    const checkPoapStatus = async (currentEvents: BlockchainEvent[]) => {
        const statusMap: Record<string, { exists: boolean, minted: boolean, isPaused: boolean }> = {};

        for (const event of currentEvents) {
            const key = `${event.creator}-${event.name}`;
            try {
                // Check if POAP collection exists
                const hasPoapRes = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        function: MODULES.POAP.HAS_POAP,
                        type_arguments: [],
                        arguments: [event.creator, event.name]
                    })
                });

                const hasPoapResult = await hasPoapRes.json();
                const exists = Array.isArray(hasPoapResult) && hasPoapResult[0] === true;

                if (exists) {
                    // Check Paused Status
                    const pausedRes = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            function: MODULES.POAP.IS_PAUSED,
                            type_arguments: [],
                            arguments: [event.creator, event.name]
                        })
                    });
                    const pausedResult = await pausedRes.json();
                    const isPaused = Array.isArray(pausedResult) && pausedResult[0] === true;

                    // Check if user minted
                    let minted = false;
                    if (account?.address) {
                        const holdersRes = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                function: MODULES.POAP.GET_HOLDERS,
                                type_arguments: [],
                                arguments: [event.creator, event.name]
                            })
                        });
                        const holdersResult = await holdersRes.json();
                        if (Array.isArray(holdersResult) && Array.isArray(holdersResult[0])) {
                            const holders = holdersResult[0];
                            // Standardization of address might be needed (0x prefix)
                            const userAddr = account.address.toString();
                            minted = holders.some((h: string) => h === userAddr || h === userAddr.replace('0x', '') || `0x${h}` === userAddr);
                        }
                    }
                    statusMap[key] = { exists, minted, isPaused };
                } else {
                    statusMap[key] = { exists: false, minted: false, isPaused: false };
                }
            } catch (e) {
                console.error(`Error checking POAP for ${event.name}:`, e);
            }
        }
        setPoapStatus(prev => ({ ...prev, ...statusMap }));
    };



    // Fetch events from blockchain
    // Fetch events from blockchain
    const fetchEvents = async () => {
        try {
            const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.SPACE.GET_ALL_EVENTS,
                    type_arguments: [],
                    arguments: [],
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result && result[0]) {
                    const eventsData = result[0] as BlockchainEvent[];
                    console.log('Fetched events:', eventsData);
                    setEvents(eventsData);
                    checkPoapStatus(eventsData);

                    // Fetch creator profiles for all unique creators
                    const uniqueCreators = [...new Set(eventsData.map(e => e.creator))];
                    if (uniqueCreators.length > 0) {
                        fetchCreatorProfiles(uniqueCreators);
                    }


                }
            } else {
                console.error('Failed to fetch events:', await response.text());
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    // Fetch creator profiles
    const fetchCreatorProfiles = async (creatorAddresses: string[]) => {
        for (const address of creatorAddresses) {
            // Skip if already cached
            if (creatorProfiles[address]) continue;

            try {
                const response = await fetch('https://testnet.movementnetwork.xyz/v1/view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        function: MODULES.PROFILE.GET_PROFILE,
                        type_arguments: [],
                        arguments: [address],
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result && result.length >= 3) {
                        const username = result[0] || 'Unknown';
                        let pfp = result[2] || '';
                        // Upgrade Twitter PFP quality
                        if (pfp.includes('pbs.twimg.com')) {
                            pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                        }
                        setCreatorProfiles(prev => ({
                            ...prev,
                            [address]: { username, pfp }
                        }));
                    }
                }
            } catch (err) {
                console.error(`Error fetching profile for ${address}:`, err);
            }
        }
    };





    useEffect(() => {
        fetchEvents();

        // Check initialization statuses
        const checkInit = async () => {
            // Check Space (Calendar)
            try {
                const res = await fetch(`${NETWORK_CONFIG.REST_URL}/accounts/${MODULE_ADDRESS}/resource/${MODULE_ADDRESS}::space::GlobalSchedule`);
                if (res.ok) setIsSpaceInitialized(true);
            } catch { }


        };
        checkInit();

        // Refresh events every 30 seconds
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletConnected || !account) {
            alert('Please connect your wallet first');
            return;
        }

        setIsLoading(true);
        try {
            // Convert date and time to Unix timestamp
            const eventDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
            const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
            const startTime = Math.floor(eventDateTime.getTime() / 1000);
            const endTime = Math.floor(endDateTime.getTime() / 1000);

            // Parse genres
            // Parse genres
            const genresList = formData.genres;

            const response = await signAndSubmitTransaction({
                data: {
                    function: MODULES.SPACE.CREATE_EVENT,
                    typeArguments: [],
                    functionArguments: [
                        formData.eventName,
                        startTime.toString(),
                        endTime.toString(),
                        formData.eventDate,
                        formData.bannerUri || '',
                        genresList,
                        formData.spaceLink || ''
                    ]
                }
            });

            console.log('Event created:', response);
            alert('🎉 Event created successfully!');

            // Refresh events list
            await fetchEvents();

            setShowModal(false);
            setFormData({
                eventName: '',
                eventDate: '',
                startTime: '',
                endTime: '',
                spaceLink: '',
                bannerUri: '',
                genres: []
            });
        } catch (error: any) {
            console.error('Error creating event:', error);
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('E_NO_PROFILE')) {
                alert('❌ Please create a profile first before creating events!');
            } else if (errorMessage.includes('E_INVALID_TIME')) {
                alert('❌ Invalid event time. Please check your dates and times.');
            } else if (errorMessage.includes('E_EVENT_OVERLAP')) {
                alert('❌ You already have an event at this time.');
            } else {
                alert(`❌ Error creating event: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };



















    const handleCreatePoapCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account || !selectedEventForPoap) return;

        setIsLoading(true);
        try {
            await signAndSubmitTransaction({
                data: {
                    function: MODULES.POAP.CREATE_COLLECTION,
                    typeArguments: [],
                    functionArguments: [
                        selectedEventForPoap.name,
                        poapFormData.description,
                        poapFormData.uri,
                        poapFormData.maxSupply,
                        poapFormData.password,
                        selectedEventForPoap.start_time,
                        selectedEventForPoap.end_time
                    ]
                }
            });
            alert('POAP Collection Created!');
            setShowCreatePoapModal(false);
            checkPoapStatus(events);
        } catch (e: any) {
            console.error(e);
            alert('Error creating POAP: ' + e.message);
        } finally { setIsLoading(false); }
    };

    const handleMintPoap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account || !selectedEventForPoap) return;

        setIsLoading(true);
        try {
            // Pre-validation Checks
            console.log("Verifying mint conditions...");

            // 1. Check Password
            const passwordRes = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.POAP.VERIFY_PASSWORD,
                    type_arguments: [],
                    arguments: [selectedEventForPoap.creator, selectedEventForPoap.name, mintPassword]
                })
            });
            const passwordValid = (await passwordRes.json())[0];
            if (!passwordValid) {
                throw new Error("Incorrect Password! Please try again.");
            }

            // 2. Check Time and Supply
            const infoRes = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.POAP.GET_POAP_INFO,
                    type_arguments: [],
                    arguments: [selectedEventForPoap.creator, selectedEventForPoap.name]
                })
            });
            const info = await infoRes.json();
            // Info: [start_time, end_time, current_supply, max_supply, is_paused]
            const startTime = parseInt(info[0]);
            const endTime = parseInt(info[1]);
            const currentSupply = parseInt(info[2]);
            const maxSupply = parseInt(info[3]);
            const isPaused = info[4];
            const now = Math.floor(Date.now() / 1000);

            if (isPaused) throw new Error("Minting is currently paused.");
            if (currentSupply >= maxSupply) throw new Error("Max supply reached!");
            if (now < startTime - 3600) throw new Error(`Minting hasn't started yet! Starts at ${new Date(startTime * 1000).toLocaleString()}`);
            if (now > endTime) throw new Error("Minting has ended.");

            console.log("Conditions met, proceeding to mint...");

            await signAndSubmitTransaction({
                data: {
                    function: MODULES.POAP.MINT_POAP,
                    typeArguments: [],
                    functionArguments: [
                        selectedEventForPoap.creator,
                        selectedEventForPoap.name,
                        mintPassword
                    ]
                }
            });
            alert('POAP Minted Successfully!');
            setShowMintPoapModal(false);
            checkPoapStatus(events);
        } catch (e: any) {
            console.error(e);
            const msg = e.message || e.toString();
            // make alert friendlier
            alert(msg.includes("Simulation failed") ? "Transaction failed (Simulation error). Check console for details." : msg);
        } finally { setIsLoading(false); }
    };

    const handleDeleteEvent = async (event: BlockchainEvent) => {
        if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

        setIsLoading(true);
        try {
            await signAndSubmitTransaction({
                data: {
                    function: MODULES.SPACE.DELETE_EVENT,
                    typeArguments: [],
                    functionArguments: [
                        event.name,
                        event.start_time
                    ]
                }
            });
            alert('Event deleted successfully!');
            fetchEvents();
        } catch (e: any) {
            console.error(e);
            alert('Failed to delete event: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePause = async (event: BlockchainEvent, isPaused: boolean) => {
        setIsLoading(true);
        try {
            await signAndSubmitTransaction({
                data: {
                    function: MODULES.POAP.SET_PAUSED,
                    typeArguments: [],
                    functionArguments: [
                        event.name,
                        !isPaused
                    ]
                }
            });
            alert(`POAP Minting ${isPaused ? 'Resumed' : 'Paused'}!`);
            checkPoapStatus(events);
        } catch (e: any) {
            console.error(e);
            alert('Action failed: ' + e.message);
        } finally { setIsLoading(false); }
    };

    const handleViewHolders = async (event: BlockchainEvent) => {
        setHoldersLoading(true);
        setCurrentHolders([]);
        setSelectedEventForPoap(event);
        setShowHoldersModal(true);

        try {
            const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.POAP.GET_HOLDERS,
                    type_arguments: [],
                    arguments: [event.creator, event.name]
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (Array.isArray(result) && Array.isArray(result[0])) {
                    setCurrentHolders(result[0]);

                    // Fetch profiles for holders if not cached
                    const unknownHolders = result[0].filter((addr: string) => !creatorProfiles[addr]);
                    if (unknownHolders.length > 0) {
                        fetchCreatorProfiles(unknownHolders);
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching holders:", e);
        } finally {
            setHoldersLoading(false);
        }
    };

    const handleDownloadCsv = () => {
        if (currentHolders.length === 0) return;

        // Header
        let csvContent = "data:text/csv;charset=utf-8,Address,Username,Profile Image\n";

        // Rows
        currentHolders.forEach(addr => {
            const profile = creatorProfiles[addr];
            const username = profile ? profile.username : "Unknown";
            const pfp = profile ? profile.pfp : "";
            const row = `${addr},${username},${pfp}`;
            csvContent += row + "\n";
        });

        // Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `poap_holders_${selectedEventForPoap?.name || 'event'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredEvents = events.filter(event => {
        // 1. Type Filters
        if (!filterState.allEvents) {
            if (filterState.myEvents) {
                const isCreator = account && (
                    event.creator === account.address.toString() ||
                    event.creator === account.address.toString().replace(/^0x/, '') ||
                    `0x${event.creator}` === account.address.toString()
                );
                if (!isCreator) return false;
            }
            if (filterState.upcoming) {
                const now = Math.floor(Date.now() / 1000);
                if (parseInt(event.start_time) < now) return false;
            }
        }

        // 2. Genre Filter
        if (selectedGenres.length > 0) {
            // If event has no genres but filtering is active, exclude it
            if (!event.genres || event.genres.length === 0) return false;

            // Check if event has at least one selected genre
            const hasGenre = event.genres.some(g => selectedGenres.includes(g));
            if (!hasGenre) return false;
        }

        return true;
    });

    const finalEvents = selectedDate
        ? filteredEvents.filter(event => {
            const eventDate = new Date(parseInt(event.start_time) * 1000);
            return eventDate.getDate() === selectedDate.getDate() &&
                eventDate.getMonth() === selectedDate.getMonth() &&
                eventDate.getFullYear() === selectedDate.getFullYear();
        })
        : filteredEvents;

    const renderCalendar = () => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        const calendarDays = [];

        // Day headers
        daysOfWeek.forEach(day => {
            calendarDays.push(
                <div key={`header-${day}`} className="calendar-day-header">
                    {day}
                </div>
            );
        });

        // Empty days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            );
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

            // Check if this day has events
            const hasEvent = filteredEvents.some(event => {
                const eventDate = new Date(parseInt(event.start_time) * 1000);
                return eventDate.toISOString().split('T')[0] === dateString;
            });

            // Check if selected
            const isSelected = selectedDate &&
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === month &&
                selectedDate.getDate() === day;

            // Check if today
            const isToday = today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

            const isGenreMatch = hasEvent && selectedGenres.length > 0;

            calendarDays.push(
                <div
                    key={`day-${day}`}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${isSelected ? 'selected' : ''} ${isGenreMatch ? 'genre-match' : ''}`}
                    onClick={() => {
                        const clickedDate = new Date(year, month, day);
                        setSelectedDate(clickedDate);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {day}
                    {hasEvent && <div className="event-dot"></div>}
                </div>
            );
        }

        return calendarDays;
    };
    return (
        <div className="calendar-page page-enter">
            <div className="page-header">
                <h1 className="page-title">Events Calendar</h1>
                <p className="page-subtitle">Discover and create community events</p>
            </div>
            <div className="calendar-layout">
                <div className="calendar-sidebar">
                    <button
                        className="primary-btn full-width"
                        onClick={() => {
                            if (!walletConnected) {
                                alert('Please connect your wallet first');
                                return;
                            }
                            // Pre-fill date if selected
                            if (selectedDate) {
                                const year = selectedDate.getFullYear();
                                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const day = String(selectedDate.getDate()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;

                                setFormData(prev => ({
                                    ...prev,
                                    eventDate: dateStr
                                }));
                            }
                            setShowModal(true);
                        }}
                    >
                        <span className="btn-icon">➕</span>
                        Create Event
                    </button>

                    {/* Admin Initialize Button */}
                    {walletConnected && account && account.address.toString().replace(/^0x/, '') === MODULE_ADDRESS && !isSpaceInitialized && (
                        <button
                            className="secondary-btn full-width"
                            style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                            onClick={async () => {
                                try {
                                    await signAndSubmitTransaction({
                                        data: {
                                            function: MODULES.SPACE.INITIALIZE_GLOBAL,
                                            typeArguments: [],
                                            functionArguments: []
                                        }
                                    });
                                    alert('🎉 Calendar initialized! Now creating events will work for everyone.');
                                    fetchEvents();
                                } catch (e) {
                                    console.error(e);
                                    alert('Failed to initialize: ' + e);
                                }
                            }}
                        >
                            <span className="btn-icon">⚙️</span>
                            Initialize Calendar
                        </button>
                    )}


                    <div className="filter-section">
                        <h3>Filter By Type</h3>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filterState.allEvents}
                                    onChange={() => handleFilterChange('allEvents')}
                                /> All Events
                            </label>
                            <label className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filterState.myEvents}
                                    onChange={() => handleFilterChange('myEvents')}
                                /> My Events
                            </label>
                            <label className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filterState.upcoming}
                                    onChange={() => handleFilterChange('upcoming')}
                                /> Upcoming
                            </label>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Filter By Genre</h3>
                        <div className="filter-options">
                            {GENRE_OPTIONS.map(genre => (
                                <label key={genre} className="filter-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedGenres.includes(genre)}
                                        onChange={() => handleGenreFilterToggle(genre)}
                                    /> {genre}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="calendar-main">
                    <div className="calendar-view">
                        <div className="calendar-header">
                            <button
                                className="calendar-nav-btn"
                                onClick={() => {
                                    const newDate = new Date(currentMonth);
                                    newDate.setMonth(currentMonth.getMonth() - 1);
                                    setCurrentMonth(newDate);
                                }}
                            >
                                ‹
                            </button>
                            <h2>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                className="calendar-nav-btn"
                                onClick={() => {
                                    const newDate = new Date(currentMonth);
                                    newDate.setMonth(currentMonth.getMonth() + 1);
                                    setCurrentMonth(newDate);
                                }}
                            >
                                ›
                            </button>
                        </div>
                        <div className="calendar-grid">
                            {renderCalendar()}
                        </div>
                    </div>
                    <div className="events-list-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>
                                {selectedDate
                                    ? `Events for ${selectedDate.toLocaleDateString()}`
                                    : 'Upcoming Events'}
                            </h3>
                            {selectedDate && (
                                <button
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.85rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedDate(null)}
                                >
                                    Show All
                                </button>
                            )}
                        </div>
                        <div className="events-list">
                            {finalEvents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                                    <p>{selectedDate ? 'No events on this day.' : 'No events scheduled yet.'}</p>
                                    <p>Be the first to create an event!</p>
                                </div>
                            ) : (
                                finalEvents.map((event, index) => {
                                    const startDate = new Date(parseInt(event.start_time) * 1000);
                                    const endDate = new Date(parseInt(event.end_time) * 1000);
                                    const monthShort = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                                    const day = startDate.getDate();
                                    const timeRange = `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
                                    const isCreator = account?.address && (account.address.toString() === event.creator || account.address.toString() === `0x${event.creator.replace(/^0x/, '')}`);

                                    return (
                                        <div key={index} className="event-card">
                                            <div className="event-time">
                                                <div className="event-date" dangerouslySetInnerHTML={{ __html: `${monthShort}<br>${day}` }}></div>
                                                <div className="event-time-range">{timeRange}</div>
                                            </div>
                                            <div className="event-details">
                                                <h4>{event.name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <div className="creator-avatar" style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: 'var(--gradient-cosmic)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {creatorProfiles[event.creator]?.pfp ? (
                                                            <img
                                                                src={creatorProfiles[event.creator].pfp}
                                                                alt={creatorProfiles[event.creator].username}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <span>{creatorProfiles[event.creator]?.username?.charAt(0).toUpperCase() || '?'}</span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>
                                                        by {creatorProfiles[event.creator]?.username || `${event.creator.slice(0, 6)}...${event.creator.slice(-4)}`}
                                                    </p>
                                                </div>
                                                {event.banner_uri && (
                                                    <div className="event-banner-container">
                                                        <img
                                                            src={event.banner_uri}
                                                            alt={event.name}
                                                            className="event-banner"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    </div>
                                                )}
                                                {event.space_link && (
                                                    <a href={event.space_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.8rem', color: '#4facfe', marginBottom: '0.5rem', textDecoration: 'none' }}>
                                                        🔗 Open Space Linked
                                                    </a>
                                                )}

                                                <div className="event-genres">
                                                    {event.genres.map((genre, i) => (
                                                        <span key={i} className="genre-badge">{genre}</span>
                                                    ))}
                                                </div>
                                                <div className="event-actions" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                    {(() => {
                                                        const key = `${event.creator}-${event.name}`;
                                                        const status = poapStatus[key] || { exists: false, minted: false, isPaused: false };

                                                        if (status.exists) {
                                                            if (status.minted) {
                                                                return (
                                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                        <span className="genre-badge" style={{ background: '#4caf50', color: 'white' }}>✨ Collected</span>
                                                                        {isCreator && (
                                                                            <button
                                                                                className="secondary-btn"
                                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                                onClick={() => handleViewHolders(event)}
                                                                            >
                                                                                👥 Holders
                                                                            </button>
                                                                        )}
                                                                        {isCreator && (
                                                                            <button
                                                                                className="secondary-btn"
                                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                                onClick={() => handleTogglePause(event, status.isPaused)}
                                                                                disabled={isLoading}
                                                                            >
                                                                                {status.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        className="primary-btn"
                                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                        onClick={() => {
                                                                            setSelectedEventForPoap(event);
                                                                            setShowMintPoapModal(true);
                                                                        }}
                                                                        disabled={status.isPaused && !isCreator}
                                                                    >
                                                                        {status.isPaused ? '🚫 Paused' : '🏆 Mint POAP'}
                                                                    </button>
                                                                    {isCreator && (
                                                                        <button
                                                                            className="secondary-btn"
                                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                            onClick={() => handleViewHolders(event)}
                                                                        >
                                                                            👥 Holders
                                                                        </button>
                                                                    )}
                                                                    {isCreator && (
                                                                        <button
                                                                            className="secondary-btn"
                                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                            onClick={() => handleTogglePause(event, status.isPaused)}
                                                                            disabled={isLoading}
                                                                        >
                                                                            {status.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        } else if (isCreator) {
                                                            return (
                                                                <button
                                                                    className="secondary-btn"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                    onClick={() => {
                                                                        setSelectedEventForPoap(event);
                                                                        setShowCreatePoapModal(true);
                                                                    }}
                                                                >
                                                                    ➕ Add POAP
                                                                </button>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    {isCreator && (
                                                        <button
                                                            className="delete-btn"
                                                            style={{
                                                                padding: '0.25rem 0.5rem',
                                                                fontSize: '0.8rem',
                                                                background: 'rgba(255, 68, 68, 0.2)',
                                                                color: '#ff4444',
                                                                border: '1px solid #ff4444',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                marginLeft: 'auto'
                                                            }}
                                                            onClick={() => handleDeleteEvent(event)}
                                                            disabled={isLoading}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {
                showModal && (
                    <div className="modal active" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Create New Event</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateEvent} className="modal-form">
                                <div className="form-group">
                                    <label>Event Name</label>
                                    <input
                                        type="text"
                                        value={formData.eventName}
                                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Time</label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Banner URL</label>
                                    <input
                                        type="url"
                                        value={formData.bannerUri}
                                        onChange={(e) => setFormData({ ...formData, bannerUri: e.target.value })}
                                        placeholder="https://example.com/banner.jpg"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Genres (Select up to 3)</label>
                                    <div className="genre-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                        gap: '0.5rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        {GENRE_OPTIONS.map(genre => (
                                            <div
                                                key={genre}
                                                className={`genre-chip ${formData.genres.includes(genre) ? 'selected' : ''}`}
                                                onClick={() => handleGenreToggle(genre)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    background: formData.genres.includes(genre) ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: formData.genres.includes(genre) ? '#000' : 'var(--color-text-secondary)',
                                                    border: `1px solid ${formData.genres.includes(genre) ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s ease',
                                                    opacity: (!formData.genres.includes(genre) && formData.genres.length >= 3) ? 0.5 : 1,
                                                    pointerEvents: (!formData.genres.includes(genre) && formData.genres.length >= 3) ? 'none' : 'auto'
                                                }}
                                            >
                                                {genre}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Space Link</label>
                                    <input
                                        type="text"
                                        value={formData.spaceLink}
                                        onChange={(e) => setFormData({ ...formData, spaceLink: e.target.value })}
                                        placeholder="https://twitter.com/space..."
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="secondary-btn" onClick={() => setShowModal(false)} disabled={isLoading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="primary-btn" disabled={isLoading}>
                                        {isLoading ? '⏳ Creating...' : 'Create Event'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                showCreatePoapModal && (
                    <div className="modal active" onClick={() => setShowCreatePoapModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Create POAP Collection</h2>
                                <button className="modal-close" onClick={() => setShowCreatePoapModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleCreatePoapCollection} className="modal-form">
                                <div className="form-group">
                                    <label>Description</label>
                                    <input type="text" value={poapFormData.description} onChange={(e) => setPoapFormData({ ...poapFormData, description: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Image URI</label>
                                    <input type="url" value={poapFormData.uri} onChange={(e) => setPoapFormData({ ...poapFormData, uri: e.target.value })} required placeholder="https://..." />
                                </div>
                                <div className="form-group">
                                    <label>Max Supply</label>
                                    <input type="number" value={poapFormData.maxSupply} onChange={(e) => setPoapFormData({ ...poapFormData, maxSupply: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Password (Optional)</label>
                                    <input type="text" value={poapFormData.password} onChange={(e) => setPoapFormData({ ...poapFormData, password: e.target.value })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="secondary-btn" onClick={() => setShowCreatePoapModal(false)}>Cancel</button>
                                    <button type="submit" className="primary-btn">{isLoading ? 'Creating...' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                showMintPoapModal && (
                    <div className="modal active" onClick={() => setShowMintPoapModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Mint POAP</h2>
                                <button className="modal-close" onClick={() => setShowMintPoapModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleMintPoap} className="modal-form">
                                <p>Minting POAP for: <strong>{selectedEventForPoap?.name}</strong></p>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="text" value={mintPassword} onChange={(e) => setMintPassword(e.target.value)} placeholder="Enter password if required" />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="secondary-btn" onClick={() => setShowMintPoapModal(false)}>Cancel</button>
                                    <button type="submit" className="primary-btn">{isLoading ? 'Minting...' : 'Mint'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                showHoldersModal && (
                    <div className="modal active" onClick={() => setShowHoldersModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2>POAP Holders</h2>
                                <button className="modal-close" onClick={() => setShowHoldersModal(false)}>&times;</button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {holdersLoading ? (
                                    <p style={{ textAlign: 'center', padding: '1rem' }}>Loading holders...</p>
                                ) : currentHolders.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '1rem', opacity: 0.6 }}>No holders yet.</p>
                                ) : (
                                    <div className="holders-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {currentHolders.map((addr, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.5rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: 'var(--gradient-cosmic)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {creatorProfiles[addr]?.pfp ? (
                                                        <img src={creatorProfiles[addr].pfp} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span>{creatorProfiles[addr]?.username?.charAt(0).toUpperCase() || '?'}</span>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                                                        {creatorProfiles[addr]?.username || `${addr.slice(0, 6)}...${addr.slice(-4)}`}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, fontFamily: 'monospace' }}>
                                                        {addr.slice(0, 10)}...{addr.slice(-8)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    className="secondary-btn"
                                    onClick={handleDownloadCsv}
                                    disabled={currentHolders.length === 0}
                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                >
                                    📥 Download CSV
                                </button>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>
                                    Total: {currentHolders.length}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
export default Calendar;
