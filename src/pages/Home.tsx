import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MODULES, NETWORK_CONFIG, MODULE_ADDRESS } from '../constants/contracts';
import './Home.css';

interface NewsItem {
    id: number;
    title: string;
    content: string;
    category: string;
    date: string;
    image?: string;
    video?: string;
    gradient: string;
    featured: boolean;
    onClick?: () => void;
}

const NewsCard = ({ item }: { item: NewsItem }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.log("Video play interrupted", e));
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <article
            className={`news-card ${item.featured ? 'featured' : ''}`}
            onClick={item.onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: item.onClick ? 'pointer' : 'default' }}
        >
            {item.featured && <div className="news-badge">Featured</div>}
            <div
                className="news-image"
                style={{
                    background: item.image ? `url(${item.image}) center/cover` : item.gradient
                }}
            >
                {item.video && (
                    <video
                        ref={videoRef}
                        src={item.video}
                        muted
                        loop
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.3s ease'
                        }}
                    />
                )}
            </div>
            <div className="news-content">
                <h2>{item.title}</h2>
                <p>{item.content}</p>
                <div className="news-meta">
                    <span className="news-date">{item.date}</span>
                    <span className="news-category">{item.category}</span>
                </div>
            </div>
        </article>
    );
};

function Home() {
    const { account, signAndSubmitTransaction } = useWallet();
    const [upsLoading, setUpsLoading] = useState(false);
    const [upsData, setUpsData] = useState({
        hasAccount: false,
        balance: 0,
        streak: 0,
        canClaim: false,
        timeUntilNextClaim: 0,
        nextClaimAmount: 0,
        isChecking: true
    });
    const [showClaimModal, setShowClaimModal] = useState(false);

    const newsItems: NewsItem[] = [
        {
            id: 1,
            title: 'Welcome to Spacely! 🚀',
            content: 'Your decentralized social hub is now live on Movement blockchain. Connect your wallet to get started and earn Stars daily!',
            category: 'Announcement',
            date: 'Just now',
            video: '/spacely.mp4',
            image: '/spacely.jpg',
            gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
            featured: true
        },
        {
            id: 2,
            title: 'Daily Star Claims Live! ⚡',
            content: 'Claim your daily Stars and build your streak. The longer your streak, the more you earn!',
            category: 'Feature',
            date: '2 hours ago',
            video: '/stars.mp4',
            image: '/stars.jpg',
            gradient: 'linear-gradient(135deg, #ffed4e 0%, #ffa500 100%)',
            featured: false,
            onClick: () => setShowClaimModal(true)
        },
        {
            id: 3,
            title: 'Create Your First Event 📅',
            content: 'Host events and invite the community. Share your schedule and connect with others.',
            category: 'Tutorial',
            date: '5 hours ago',
            video: '/sched.mp4',
            image: '/sched.png',
            gradient: 'linear-gradient(135deg, #ffc107 0%, #ff6f00 100%)',
            featured: false
        },
        {
            id: 4,
            title: 'Join the Community Chat 💬',
            content: 'Connect with fellow users in our public forum or send private messages to your contacts.',
            category: 'Community',
            date: '1 day ago',
            video: '/chat.mp4',
            image: '/chat.jpg',
            gradient: 'linear-gradient(135deg, #ffb700 0%, #ff9100 100%)',
            featured: false
        },
    ];

    const fetchUpsData = async () => {
        if (!account?.address) {
            setUpsData(prev => ({ ...prev, isChecking: false }));
            return;
        }

        setUpsData(prev => ({ ...prev, isChecking: true }));

        try {
            // Check if account exists
            const hasAccountRes = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.UPS.HAS_ACCOUNT,
                    type_arguments: [],
                    arguments: [account.address.toString()]
                })
            });

            const result = await hasAccountRes.json();
            // Robust boolean check: handle boolean true, string "true", or 1
            const hasAccountRaw = result[0];
            let hasAccount = hasAccountRaw === true || hasAccountRaw === "true" || hasAccountRaw === 1;

            // Fallback: Check for resource existence if view function returns false
            if (!hasAccount) {
                try {
                    const resourceRes = await fetch(`${NETWORK_CONFIG.REST_URL}/accounts/${account.address.toString()}/resource/${MODULE_ADDRESS}::ups::UpsAccount`);
                    if (resourceRes.ok) {
                        hasAccount = true;
                        console.log("Account confirmed via Resource check!");
                    }
                } catch (e) {
                    console.error("Resource check failed:", e);
                }
            }

            console.log("Check Account Result:", hasAccount, "(Raw:", hasAccountRaw, ") for address:", account.address);

            if (!hasAccount) {
                setUpsData(prev => ({ ...prev, hasAccount: false, isChecking: false }));
                return;
            }

            // Fetch Full Data in Parallel
            const [balanceRes, streakRes, canClaimRes, timeRes, amountRes] = await Promise.all([
                fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ function: MODULES.UPS.GET_BALANCE, type_arguments: [], arguments: [account.address.toString()] })
                }),
                fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ function: MODULES.UPS.GET_STREAK, type_arguments: [], arguments: [account.address.toString()] })
                }),
                fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ function: MODULES.UPS.CAN_CLAIM, type_arguments: [], arguments: [account.address.toString()] })
                }),
                fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ function: MODULES.UPS.GET_TIME_UNTIL_NEXT_CLAIM, type_arguments: [], arguments: [account.address.toString()] })
                }),
                fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ function: MODULES.UPS.GET_NEXT_CLAIM_AMOUNT, type_arguments: [], arguments: [account.address.toString()] })
                })
            ]);

            const [balance] = await balanceRes.json();
            const [streak] = await streakRes.json();
            const [canClaim] = await canClaimRes.json();
            const [timeUntil] = await timeRes.json();
            const [nextAmount] = await amountRes.json();

            setUpsData({
                hasAccount: true,
                balance: Number(balance || 0),
                streak: Number(streak || 0),
                canClaim: canClaim === true,
                timeUntilNextClaim: Number(timeUntil || 0),
                nextClaimAmount: Number(nextAmount || 0),
                isChecking: false
            });

        } catch (e) {
            console.error("Error fetching UPS data:", e);
            setUpsData(prev => ({ ...prev, isChecking: false }));
        }
    };

    useEffect(() => {
        fetchUpsData();
        const interval = setInterval(fetchUpsData, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [account]);

    const handleUpsAction = async () => {
        if (!account) return;
        setUpsLoading(true);

        try {
            const func = upsData.hasAccount ? MODULES.UPS.CLAIM_DAILY : MODULES.UPS.INITIALIZE_ACCOUNT;
            console.log("Handling UPS Action. Has Account:", upsData.hasAccount);
            console.log("Calling Function:", func);

            await signAndSubmitTransaction({
                data: {
                    function: func,
                    typeArguments: [],
                    functionArguments: []
                }
            });

            alert(upsData.hasAccount ? "Daily Stars Claimed! ⚡" : "Account Ready! Click Claim again to get your reward.");

            // Optimistic update: If we just initialized, switch UI immediately
            if (!upsData.hasAccount) {
                setUpsData(prev => ({ ...prev, hasAccount: true, canClaim: true, isChecking: false }));
            }

            // Wait a moment for chain update then refresh
            setTimeout(fetchUpsData, 2000);
            if (upsData.canClaim) {
                setShowClaimModal(false); // Close modal after successful claim
            }

        } catch (e: any) {
            console.error(e);
            // Check if error implies account already exists (Optimization)
            // Error code 2 is E_ALREADY_INITIALIZED in ups.move
            const errorMessage = e.message || JSON.stringify(e);
            if (errorMessage.includes("0x2") || errorMessage.includes("ALREADY_INITIALIZED") || errorMessage.includes("exists")) {
                console.log("Account already exists detected via error!");
                setUpsData(prev => ({ ...prev, hasAccount: true, isChecking: false }));
                alert("Account found! You are already initialized.");
                fetchUpsData(); // Refresh data
            } else {
                alert("Action failed: " + errorMessage);
            }
        } finally {
            setUpsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "Ready!";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="home-page page-enter">
            {/* Claim Modal */}
            {showClaimModal && (
                <div className="modal active" onClick={() => setShowClaimModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Daily Rewards ⚡</h2>
                            <button className="modal-close" onClick={() => setShowClaimModal(false)}>&times;</button>
                        </div>

                        <div style={{ padding: '1rem 0' }}>
                            {upsData.isChecking ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <div className="loading-spinner"></div>
                                    <p style={{ marginTop: '1rem', opacity: 0.7 }}>Checking account status...</p>
                                </div>
                            ) : !upsData.hasAccount ? (
                                <div>
                                    <button
                                        className="primary-btn pulse-animation full-width"
                                        onClick={handleUpsAction}
                                        disabled={upsLoading}
                                        style={{ marginBottom: '1rem', background: '#e0c200', color: '#000' }}
                                    >
                                        {upsLoading ? 'Initializing...' : '🚀 Initialize Account'}
                                    </button>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Current Streak</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🔥 0 Days</div>
                                        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                                            Initialize to unlock daily claims!
                                        </p>
                                    </div>
                                    <button
                                        className="primary-btn full-width"
                                        disabled={true}
                                        style={{ opacity: 0.5, cursor: 'not-allowed', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
                                    >
                                        🔒 Claim Reward
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Current Streak</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🔥 {upsData.streak} Days</div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Next Reward</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+{upsData.nextClaimAmount} Stars</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Status</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: upsData.canClaim ? '#4caf50' : '#ff9800' }}>
                                                    {upsData.canClaim ? 'Ready!' : formatTime(upsData.timeUntilNextClaim)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className={`primary-btn full-width ${upsData.canClaim ? 'pulse-animation' : ''}`}
                                        onClick={handleUpsAction}
                                        disabled={upsLoading || !upsData.canClaim}
                                        style={{
                                            padding: '1rem',
                                            background: upsData.canClaim ? undefined : 'rgba(255,255,255,0.1)',
                                            borderColor: upsData.canClaim ? undefined : 'rgba(255,255,255,0.1)',
                                            cursor: upsData.canClaim ? 'pointer' : 'default'
                                        }}
                                    >
                                        {upsLoading ? 'Claiming...' : upsData.canClaim ? '⚡ Claim Reward' : 'Come Back Later'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <h1 className="page-title">Latest News</h1>
                <p className="page-subtitle">Stay updated with the latest happenings</p>
            </div>
            <div className="news-grid">
                {newsItems.map((item) => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

export default Home;
