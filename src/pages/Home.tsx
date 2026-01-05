import './Home.css';
function Home() {
    const newsItems = [
        {
            id: 1,
            title: 'Welcome to Spacely! 🚀',
            content: 'Your decentralized social hub is now live on Movement blockchain. Connect your wallet to get started and earn UPS points daily!',
            category: 'Announcement',
            date: 'Just now',
            gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
            featured: true
        },
        {
            id: 2,
            title: 'Daily UPS Claims Live! ⚡',
            content: 'Claim your daily UPS points and build your streak. The longer your streak, the more you earn!',
            category: 'Feature',
            date: '2 hours ago',
            gradient: 'linear-gradient(135deg, #ffed4e 0%, #ffa500 100%)',
            featured: false
        },
        {
            id: 3,
            title: 'Create Your First Event 📅',
            content: 'Host events and invite the community. Share your schedule and connect with others.',
            category: 'Tutorial',
            date: '5 hours ago',
            gradient: 'linear-gradient(135deg, #ffc107 0%, #ff6f00 100%)',
            featured: false
        },
        {
            id: 4,
            title: 'Join the Community Chat 💬',
            content: 'Connect with fellow users in our public forum or send private messages to your contacts.',
            category: 'Community',
            date: '1 day ago',
            gradient: 'linear-gradient(135deg, #ffb700 0%, #ff9100 100%)',
            featured: false
        }
    ];
    return (
        <div className="home-page page-enter">
            <div className="page-header">
                <h1 className="page-title">Latest News</h1>
                <p className="page-subtitle">Stay updated with the latest happenings</p>
            </div>
            <div className="news-grid">
                {newsItems.map(item => (
                    <article
                        key={item.id}
                        className={`news-card ${item.featured ? 'featured' : ''}`}
                    >
                        {item.featured && <div className="news-badge">Featured</div>}
                        <div className="news-image" style={{ background: item.gradient }}></div>
                        <div className="news-content">
                            <h2>{item.title}</h2>
                            <p>{item.content}</p>
                            <div className="news-meta">
                                <span className="news-date">{item.date}</span>
                                <span className="news-category">{item.category}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
export default Home;
