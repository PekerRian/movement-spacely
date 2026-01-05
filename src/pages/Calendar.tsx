import { useState } from 'react';
import './Calendar.css';
interface CalendarProps {
    walletConnected: boolean;
}
function Calendar({ walletConnected }: CalendarProps) {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        eventName: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        bannerUri: '',
        genres: ''
    });
    const events = [
        {
            id: 1,
            name: 'Welcome Meetup',
            date: 'JAN\n15',
            time: '2:00 PM - 5:00 PM',
            description: 'Join us for the inaugural Spacely community gathering',
            genres: ['Social', 'Networking']
        },
        {
            id: 2,
            name: 'Web3 Workshop',
            date: 'JAN\n20',
            time: '6:00 PM - 8:00 PM',
            description: 'Learn about blockchain development and Movement',
            genres: ['Education', 'Tech']
        }
    ];
    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletConnected) {
            alert('Please connect your wallet first');
            return;
        }
        console.log('Creating event:', formData);
        setShowModal(false);
        setFormData({
            eventName: '',
            eventDate: '',
            startTime: '',
            endTime: '',
            bannerUri: '',
            genres: ''
        });
    };
    const renderCalendar = () => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDays = [];
        daysOfWeek.forEach(day => {
            calendarDays.push(
                <div key={`header-${day}`} className="calendar-day-header">
                    {day}
                </div>
            );
        });
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            );
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === currentDate.getDate();
            const hasEvent = [5, 15, 20, 25].includes(day);
            calendarDays.push(
                <div
                    key={`day-${day}`}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}
                >
                    {day}
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
                            setShowModal(true);
                        }}
                    >
                        <span className="btn-icon">➕</span>
                        Create Event
                    </button>
                    <div className="filter-section">
                        <h3>Filter Events</h3>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input type="checkbox" defaultChecked /> All Events
                            </label>
                            <label className="filter-option">
                                <input type="checkbox" defaultChecked /> My Events
                            </label>
                            <label className="filter-option">
                                <input type="checkbox" defaultChecked /> Upcoming
                            </label>
                        </div>
                    </div>
                </div>
                <div className="calendar-main">
                    <div className="calendar-view">
                        <div className="calendar-header">
                            <button className="calendar-nav-btn">‹</button>
                            <h2>January 2026</h2>
                            <button className="calendar-nav-btn">›</button>
                        </div>
                        <div className="calendar-grid">
                            {renderCalendar()}
                        </div>
                    </div>
                    <div className="events-list-section">
                        <h3>Upcoming Events</h3>
                        <div className="events-list">
                            {events.map(event => (
                                <div key={event.id} className="event-card">
                                    <div className="event-time">
                                        <div className="event-date" dangerouslySetInnerHTML={{ __html: event.date.replace('\n', '<br>') }}></div>
                                        <div className="event-time-range">{event.time}</div>
                                    </div>
                                    <div className="event-details">
                                        <h4>{event.name}</h4>
                                        <p>{event.description}</p>
                                        <div className="event-genres">
                                            {event.genres.map((genre, i) => (
                                                <span key={i} className="genre-badge">{genre}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            { }
            {showModal && (
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
                                <label>Genres (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.genres}
                                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                                    placeholder="Music, Art, Tech"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Calendar;
