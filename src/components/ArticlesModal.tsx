import { useState, useEffect, useCallback } from 'react';
import './ArticlesModal.css';

interface Article {
    text: string;
    url: string;
    media: string;
}

interface ArticlesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ArticlesModal({ isOpen, onClose }: ArticlesModalProps) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance in pixels
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }
    };

    const fetchArticles = async () => {
        const fetchedArticles: Article[] = [];
        let i = 1;
        let running = true;

        while (running && i <= 10) { // Limit to 10 for safety
            try {
                const response = await fetch(`/articles/article${i}.txt`);
                if (!response.ok) {
                    running = false;
                    break;
                }
                const text = await response.text();
                const lines = text.split('\n');
                const article: Article = { text: '', url: '', media: '' };

                lines.forEach(line => {
                    if (line.startsWith('TEXT:')) article.text = line.replace('TEXT:', '').trim();
                    if (line.startsWith('URL:')) article.url = line.replace('URL:', '').trim();
                    if (line.startsWith('MEDIA:')) article.media = line.replace('MEDIA:', '').trim();
                });

                if (article.text) {
                    fetchedArticles.push(article);
                }
                i++;
            } catch (e) {
                running = false;
            }
        }
        setArticles(fetchedArticles);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchArticles();
        }
    }, [isOpen]);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, [articles.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
    };

    useEffect(() => {
        if (!isOpen || articles.length <= 1) return;

        const timer = setInterval(nextSlide, 5000); // 5s autoplay
        return () => clearInterval(timer);
    }, [isOpen, articles.length, nextSlide]);

    if (!isOpen) return null;

    return (
        <div className="articles-modal-overlay" onClick={onClose}>
            <div className="articles-modal-content" onClick={e => e.stopPropagation()}>
                <button className="articles-modal-close" onClick={onClose}>&times;</button>

                {loading ? (
                    <div className="articles-loading">
                        <div className="spinner"></div>
                        <p>Exploring Articles...</p>
                    </div>
                ) : articles.length > 0 ? (
                    <div className="articles-carousel"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="articles-slides"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {articles.map((article, index) => (
                                <div key={index} className="article-slide">
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="article-media-container"
                                        title="Click to learn more"
                                    >
                                        {article.media.endsWith('.mp4') ? (
                                            <video
                                                src={`/${article.media}`}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                className="article-media"
                                            />
                                        ) : (
                                            <img
                                                src={`/${article.media}`}
                                                alt=""
                                                className="article-media"
                                            />
                                        )}
                                        <div className="media-overlay-hint">Click to learn more</div>
                                    </a>
                                    <div className="article-text-content">
                                        <h3>Article {index + 1}</h3>
                                        <p>{article.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {articles.length > 1 && (
                            <>
                                <button className="carousel-control prev" onClick={prevSlide}>&#10094;</button>
                                <button className="carousel-control next" onClick={nextSlide}>&#10095;</button>
                                <div className="carousel-indicators">
                                    {articles.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentIndex(index)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="no-articles">No articles found.</div>
                )}
            </div>
        </div>
    );
}
