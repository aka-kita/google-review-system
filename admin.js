// グローバル変数
let allReviews = [];
let filteredReviews = [];

// DOM要素の取得
const reviewsContainer = document.getElementById('reviewsContainer');
const reviewCount = document.getElementById('reviewCount');
const totalReviewsElement = document.getElementById('totalReviews');
const averageRatingElement = document.getElementById('averageRating');
const positiveReviewsElement = document.getElementById('positiveReviews');
const recentReviewsElement = document.getElementById('recentReviews');
const modal = document.getElementById('reviewModal');
const modalContent = document.getElementById('modalContent');

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    updateStats();
    displayReviews();
});

// レビューデータを読み込み（Firebase Realtime Database）
function loadReviews() {
    // Firebase からリアルタイムでデータを取得
    FirebaseDB.getReviews((reviews) => {
        allReviews = reviews;
        
        // 日付をDateオブジェクトに変換
        allReviews.forEach(review => {
            review.date = new Date(review.timestamp);
        });
        
        // 統計情報とレビュー表示を更新
        updateStats();
        filterReviews();
        
        console.log('Firebaseからレビューデータを取得しました:', allReviews.length + '件');
    });
}

// 統計情報を更新
function updateStats() {
    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0 
        ? (allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
        : '0.0';
    const positiveReviews = allReviews.filter(review => review.rating >= 4).length;
    
    // 今月のレビュー数を計算
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const recentReviews = allReviews.filter(review => {
        const reviewDate = new Date(review.timestamp);
        return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
    }).length;
    
    // DOM要素を更新
    totalReviewsElement.textContent = totalReviews;
    averageRatingElement.textContent = averageRating;
    positiveReviewsElement.textContent = positiveReviews;
    recentReviewsElement.textContent = recentReviews;
}

// レビューを表示
function displayReviews() {
    if (filteredReviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>レビューがありません</h3>
                <p>まだレビューが投稿されていません。</p>
            </div>
        `;
        reviewCount.textContent = '0件表示中';
        return;
    }
    
    const reviewsHTML = filteredReviews.map((review, index) => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const date = new Date(review.timestamp).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="review-card" onclick="showReviewDetail(${index})">
                <div class="review-header">
                    <div class="review-info">
                        <div class="review-nickname">${review.nickname || '匿名'}</div>
                        <div class="review-date">${date}</div>
                    </div>
                    <div class="review-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-number">${review.rating}/5</span>
                    </div>
                </div>
                <div class="review-comment">
                    ${review.comment.length > 100 
                        ? review.comment.substring(0, 100) + '...' 
                        : review.comment}
                </div>
                <div class="review-actions">
                    <button class="btn btn-small btn-view" onclick="event.stopPropagation(); showReviewDetail(${index})">
                        <i class="fas fa-eye"></i> 詳細
                    </button>
                    <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); deleteReview('${review.id}')">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    reviewsContainer.innerHTML = reviewsHTML;
    reviewCount.textContent = `${filteredReviews.length}件表示中`;
}

// レビューをフィルタリング
function filterReviews() {
    const ratingFilter = document.getElementById('ratingFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    
    // フィルタリング
    filteredReviews = allReviews.filter(review => {
        // 評価フィルター
        if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) {
            return false;
        }
        
        // 日付フィルター
        if (dateFilter !== 'all') {
            const reviewDate = new Date(review.timestamp);
            const now = new Date();
            
            switch (dateFilter) {
                case 'today':
                    if (reviewDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (reviewDate < weekAgo) return false;
                    break;
                case 'month':
                    if (reviewDate.getMonth() !== now.getMonth() || 
                        reviewDate.getFullYear() !== now.getFullYear()) return false;
                    break;
                case 'year':
                    if (reviewDate.getFullYear() !== now.getFullYear()) return false;
                    break;
            }
        }
        
        // 検索フィルター
        if (searchInput) {
            const nickname = (review.nickname || '').toLowerCase();
            const comment = review.comment.toLowerCase();
            if (!nickname.includes(searchInput) && !comment.includes(searchInput)) {
                return false;
            }
        }
        
        return true;
    });
    
    // ソート
    filteredReviews.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.timestamp) - new Date(a.timestamp);
            case 'oldest':
                return new Date(a.timestamp) - new Date(b.timestamp);
            case 'rating-high':
                return b.rating - a.rating;
            case 'rating-low':
                return a.rating - b.rating;
            default:
                return 0;
        }
    });
    
    displayReviews();
}

// レビュー詳細を表示
function showReviewDetail(index) {
    const review = filteredReviews[index];
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.timestamp).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <div class="modal-title">レビュー詳細</div>
            <div class="modal-meta">
                <div>投稿者: ${review.nickname || '匿名'}</div>
                <div>投稿日時: ${date}</div>
                <div>評価: <span class="stars">${stars}</span> (${review.rating}/5)</div>
            </div>
        </div>
        <div class="modal-body">
            <div class="review-comment-full">
                ${review.comment.replace(/\n/g, '<br>')}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="deleteReview('${review.id}')">
                <i class="fas fa-trash"></i> 削除
            </button>
            <button class="btn btn-secondary" onclick="closeModal()">閉じる</button>
        </div>
    `;
    
    modal.style.display = 'block';
}

// モーダルを閉じる
function closeModal() {
    modal.style.display = 'none';
}

// モーダルの外側をクリックして閉じる
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

// レビューをエクスポート
function exportReviews() {
    const csv = generateCSV();
    const filename = `reviews_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
}

// CSVを生成
function generateCSV() {
    const headers = ['投稿日時', 'ニックネーム', '評価', 'コメント'];
    const rows = allReviews.map(review => [
        new Date(review.timestamp).toLocaleString('ja-JP'),
        review.nickname || '匿名',
        review.rating,
        `"${review.comment.replace(/"/g, '""')}"`
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// CSVをダウンロード
function downloadCSV(content, filename) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 全レビューを削除
function clearAllReviews() {
    if (confirm('本当に全てのレビューを削除しますか？この操作は取り消せません。')) {
        FirebaseDB.clearAllReviews().then(() => {
            alert('全てのレビューを削除しました。');
            console.log('全レビューを削除しました');
        }).catch((error) => {
            console.error('レビューの削除に失敗しました:', error);
            alert('レビューの削除に失敗しました。');
        });
    }
}

// 個別レビューを削除
function deleteReview(reviewId) {
    if (confirm('このレビューを削除しますか？')) {
        FirebaseDB.deleteReview(reviewId).then(() => {
            alert('レビューを削除しました。');
            console.log('レビューを削除しました:', reviewId);
            closeModal();
        }).catch((error) => {
            console.error('レビューの削除に失敗しました:', error);
            alert('レビューの削除に失敗しました。');
        });
    }
}

// キーボードショートカット
document.addEventListener('keydown', function(event) {
    // ESCキーでモーダルを閉じる
    if (event.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
    }
    
    // Ctrl+E でエクスポート
    if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        exportReviews();
    }
    
    // Ctrl+F で検索にフォーカス
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// 自動更新（オプション）
setInterval(function() {
    const currentReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    if (currentReviews.length !== allReviews.length) {
        loadReviews();
        updateStats();
        filterReviews(); // 現在のフィルターを適用して再表示
    }
}, 5000); // 5秒ごとにチェック 