let currentRating = 0;

// DOMContentLoaded内でDOM要素を取得し、星のイベントバインドも行う
document.addEventListener('DOMContentLoaded', function() {
    // DOM要素の取得
    const stars = document.querySelectorAll('.stars i');
    const feedbackSection = document.getElementById('feedbackSection');
    const message = document.getElementById('message');
    const googleReviewSection = document.getElementById('googleReviewSection');
    const nicknameInput = document.getElementById('nickname');
    const commentTextarea = document.getElementById('comment');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');

    // 星評価のイベントリスナーを設定
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            setRating(rating);
        });
        // ホバー効果
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
        });
        star.addEventListener('mouseleave', function() {
            highlightStars(currentRating);
        });
    });

    // 初期状態では星を非アクティブにする
    stars.forEach(star => {
        star.classList.remove('active');
    });

    // コメント欄の文字数カウント
    commentTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = currentLength;
        if (currentLength >= 450) {
            charCount.style.color = '#ff6b6b';
        } else if (currentLength >= 400) {
            charCount.style.color = '#ffa726';
        } else {
            charCount.style.color = '#667eea';
        }
        checkSubmitButton();
    });

    // 送信ボタンの有効化チェック
    checkSubmitButton();

    // フォームの入力値を監視
    nicknameInput.addEventListener('input', function() {
        if (this.value.length > 20) {
            this.value = this.value.substring(0, 20);
        }
    });

    // セッションストレージからレビューデータを復元（ページリロード時）
    const savedReview = sessionStorage.getItem('pendingReview');
    if (savedReview) {
        try {
            const reviewData = JSON.parse(savedReview);
            currentRating = reviewData.rating || 0;
            nicknameInput.value = reviewData.nickname || '';
            commentTextarea.value = reviewData.comment || '';
            highlightStars(currentRating);
            charCount.textContent = commentTextarea.value.length;
            checkSubmitButton();
            console.log('レビューデータを復元しました:', reviewData);
        } catch (error) {
            console.error('レビューデータの復元に失敗しました:', error);
        }
    }

    // キーボードショートカットのイベントリスナーを追加
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            const pendingReview = sessionStorage.getItem('pendingReview');
            if (pendingReview) {
                showCopyNotification();
            }
        }
    });
});

// 星をハイライト表示
function highlightStars(rating) {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// 星評価を設定
function setRating(rating) {
    currentRating = rating;
    highlightStars(rating);
    checkSubmitButton();
}

// 送信ボタンの有効化チェック
function checkSubmitButton() {
    const commentTextarea = document.getElementById('comment');
    const submitBtn = document.getElementById('submitBtn');
    const comment = commentTextarea.value.trim();
    
    // 星評価が選択され、かつコメントが入力されている場合のみ有効化
    if (currentRating > 0 && comment.length > 0) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// レビューを送信
function submitReview() {
    const feedbackSection = document.getElementById('feedbackSection');
    const message = document.getElementById('message');
    const googleReviewSection = document.getElementById('googleReviewSection');
    const commentTextarea = document.getElementById('comment');
    const submitBtn = document.getElementById('submitBtn');
    
    if (currentRating === 0) {
        alert('星評価を選択してください。');
        return;
    }
    
    const comment = commentTextarea.value.trim();
    if (comment.length === 0) {
        alert('コメントを入力してください。');
        commentTextarea.focus();
        return;
    }
    
    // 送信ボタンを無効化して重複送信を防ぐ
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 送信中...';
    
    // レビューデータを保存
    saveReviewData().then(() => {
        // フォームセクションを非表示
        document.querySelector('.form-section').style.display = 'none';
        document.querySelector('.rating-section').style.display = 'none';
        
        // フィードバックセクションを表示
        feedbackSection.style.display = 'block';
        
        // 評価に応じたメッセージを表示
        if (currentRating >= 4) {
            // 星4以上の場合
            message.textContent = '素晴らしい評価をありがとうございます！';
            googleReviewSection.style.display = 'block';
        } else {
            // 星3以下の場合
            message.textContent = 'レビューへの協力ありがとうございました。';
            googleReviewSection.style.display = 'none';
        }
        
        // 送信ボタンを非表示
        submitBtn.style.display = 'none';
    }).catch((error) => {
        console.error('レビューの保存に失敗しました:', error);
        alert('レビューの送信に失敗しました。もう一度お試しください。');
        
        // 送信ボタンを元に戻す
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> レビューを送信';
    });
}

// レビューデータを取得
function getReviewData() {
    const nicknameInput = document.getElementById('nickname');
    const commentTextarea = document.getElementById('comment');
    
    return {
        rating: currentRating,
        nickname: nicknameInput.value.trim(),
        comment: commentTextarea.value.trim(),
        timestamp: new Date().toISOString()
    };
}

// レビューデータを保存（Firebase Realtime Database）
function saveReviewData() {
    const reviewData = getReviewData();
    
    // Firebase にデータを保存
    return FirebaseDB.saveReview(reviewData).then(() => {
        // コンソールに保存されたデータを表示（デバッグ用）
        console.log('レビューデータがFirebaseに保存されました:', reviewData);
    }).catch((error) => {
        console.error('Firebaseへの保存に失敗しました:', error);
        throw error;
    });
}

// Googleレビューを書く
function writeGoogleReview() {
    const commentTextarea = document.getElementById('comment');
    const nicknameInput = document.getElementById('nickname');
    
    // お店のGoogleレビューページのURLをここに設定してください
    const googleReviewUrl = 'https://www.google.com/search?sca_esv=e5fb96b603781b63&sxsrf=AE3TifO2GQGWc71Wpy5Ikrw3VkSoUW0Srw:1750670478690&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-ExfKQM3wvSM-RIIUtetSKMSfNwCB0HS2BqOdOWsc5UUmLR_BUNyedCL21pKqNacYV9OLiy9m_lcfXIQasXPuuA4XtkcrVdgT8g7YK7p3ev561NDvRwcWWp26V-Y2f3Bn1YwBkHI%3D&q=%E3%83%A1%E3%83%87%E3%82%A3%E3%82%AB%E3%83%AB%E6%95%B4%E4%BD%93%E9%99%A2+ACTX+%E3%82%AF%E3%83%81%E3%82%B3%E3%83%9F&sa=X&ved=2ahUKEwig6YDgm4eOAxVFja8BHfJTAOUQ0bkNegQILxAE&biw=1272&bih=674&dpr=1.5#';
    
    // レビューデータを準備
    const reviewData = {
        rating: currentRating,
        comment: commentTextarea.value.trim(),
        nickname: nicknameInput.value.trim()
    };
    
    // コメント内容をクリップボードにコピー
    if (reviewData.comment) {
        copyToClipboard(reviewData.comment);
    }
    
    // レビューデータをセッションストレージに保存（他のタブで使用するため）
    sessionStorage.setItem('pendingReview', JSON.stringify(reviewData));
    
    // 新しいタブでGoogleレビューページを開く
    const newWindow = window.open(googleReviewUrl, '_blank');
    
    // 自動入力のためのメッセージを表示
    if (reviewData.comment) {
        showSuccessMessage('コピーが完了しました。<br>Googleレビューページで貼り付けをお願いします。');
    } else {
        showSuccessMessage('Googleレビューページを開きました。<br>レビューの投稿をお願いします！');
    }
}

// レビューをスキップ
function skipReview() {
    showSuccessMessage('レビューの投稿をスキップしました。ご協力ありがとうございました。');
}

// 成功メッセージを表示
function showSuccessMessage(text) {
    const message = document.getElementById('message');
    // 既存のメッセージを更新（HTMLタグを解釈）
    message.innerHTML = text;
    
    // ボタンを非表示にする
    const googleReviewSection = document.getElementById('googleReviewSection');
    googleReviewSection.style.display = 'none';
    
    // 3秒後にメッセージをフェードアウト
    setTimeout(() => {
        const feedbackSection = document.getElementById('feedbackSection');
        feedbackSection.style.opacity = '0.7';
    }, 3000);
}

// クリップボードにコピーする関数
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // モダンブラウザ用
        navigator.clipboard.writeText(text).then(() => {
            console.log('コメントをクリップボードにコピーしました');
            showCopySuccessMessage();
        }).catch(err => {
            console.error('クリップボードへのコピーに失敗しました:', err);
            // フォールバック用の方法を試す
            fallbackCopyToClipboard(text);
        });
    } else {
        // フォールバック用（古いブラウザ対応）
        fallbackCopyToClipboard(text);
    }
}

// フォールバック用のクリップボードコピー
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('コメントをクリップボードにコピーしました（フォールバック）');
        showCopySuccessMessage();
    } catch (err) {
        console.error('クリップボードへのコピーに失敗しました:', err);
        showCopyFallbackMessage(text);
    }
    
    document.body.removeChild(textArea);
}

// コピー成功メッセージを表示
function showCopySuccessMessage() {
    const message = '✅ レビュー文章がクリップボードにコピーされました！';
    showCopyNotification(message, 'success');
}

// コピー失敗時のフォールバックメッセージ
function showCopyFallbackMessage(text) {
    const message = '📋 レビュー文章を手動でコピーしてください';
    showCopyNotification(message, 'warning');
    
    // テキストを選択可能な状態で表示
    showSelectableText(text);
}

// 選択可能なテキストを表示
function showSelectableText(text) {
    const selectableText = document.createElement('div');
    selectableText.className = 'selectable-text';
    selectableText.innerHTML = `
        <h4>📋 レビュー文章（タップしてコピー）</h4>
        <div class="text-content" onclick="selectText(this)">
            ${text.replace(/\n/g, '<br>')}
        </div>
        <p class="copy-hint">上記の文章をタップして選択し、長押しでコピーしてください</p>
    `;
    
    const messageElement = document.getElementById('message');
    messageElement.appendChild(selectableText);
}

// テキストを選択する関数
function selectText(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // スマホでの長押しコピーを促す
    showLongPressHint();
}

// 長押しヒントを表示
function showLongPressHint() {
    const hint = document.createElement('div');
    hint.className = 'long-press-hint';
    hint.innerHTML = `
        <i class="fas fa-hand-pointer"></i>
        <span>選択したテキストを長押しして「コピー」を選択してください</span>
    `;
    
    document.body.appendChild(hint);
    
    setTimeout(() => {
        if (hint.parentNode) {
            hint.parentNode.removeChild(hint);
        }
    }, 3000);
}

// コピー通知を表示（改善版）
function showCopyNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `copy-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒後に通知を削除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// キーボードショートカットのヒントを表示
function showKeyboardShortcuts() {
    const shortcuts = `
        <div class="keyboard-shortcuts">
            <h4>⌨️ 便利なショートカット</h4>
            <div class="shortcut-grid">
                <div class="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>V</kbd>
                    <span>レビュー文章を貼り付け</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                    <span>入力内容を元に戻す</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Tab</kbd>
                    <span>次の入力欄に移動</span>
                </div>
            </div>
        </div>
    `;
    
    // 既存のメッセージに追加
    const messageElement = document.getElementById('message');
    messageElement.innerHTML += shortcuts;
}

// 自動入力の手順を表示
function showAutoFillInstructions() {
    const instructions = `
        <div class="auto-fill-instructions">
            <h3>📝 自動入力の手順</h3>
            <ol>
                <li>Googleレビューページで「レビューを書く」をクリック</li>
                <li>テキストエリアをクリックしてフォーカスを当てる</li>
                <li><strong>Ctrl+V</strong>（Macの場合は<strong>Cmd+V</strong>）で貼り付け</li>
                <li>星評価も同じく選択してください</li>
                <li>「投稿」ボタンをクリック</li>
            </ol>
            <div class="shortcut-hint">
                <i class="fas fa-keyboard"></i> ショートカットキー: <kbd>Ctrl</kbd> + <kbd>V</kbd>
            </div>
            <div class="review-preview">
                <h4>📋 コピーされたレビュー内容</h4>
                <div class="review-content">
                    <div class="stars-preview">
                        ${'★'.repeat(currentRating)}${'☆'.repeat(5 - currentRating)}
                    </div>
                    <div class="comment-preview">
                        "${document.getElementById('comment').value.trim()}"
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 既存のメッセージに追加
    const messageElement = document.getElementById('message');
    messageElement.innerHTML += instructions;
}

// より詳細なGoogleレビュー投稿ガイドを表示
function showDetailedGuide() {
    // デバイスがスマホかどうかを判定
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const guide = `
        <div class="detailed-guide">
            <h3>📖 Googleレビュー投稿の詳細ガイド</h3>
            <div class="guide-steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h4>Googleレビューページを開く</h4>
                        <p>新しいタブでGoogleレビューページが開きます</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h4>「レビューを書く」をタップ</h4>
                        <p>ページ内の「レビューを書く」ボタンをタップします</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h4>星評価を選択</h4>
                        <p>同じ星評価（${currentRating}つ星）を選択してください</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h4>レビュー文章を入力</h4>
                        ${isMobile ? 
                            '<p>テキストエリアをタップして、コピーした文章を貼り付けます</p>' :
                            '<p>テキストエリアをクリックして、<strong>Ctrl+V</strong>で貼り付け</p>'
                        }
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        <h4>投稿を完了</h4>
                        <p>「投稿」ボタンをタップして完了です</p>
                    </div>
                </div>
            </div>
            ${isMobile ? `
                <div class="mobile-tips">
                    <h4>📱 スマホでの便利な操作</h4>
                    <ul>
                        <li>レビュー文章を長押しして「コピー」を選択</li>
                        <li>Googleレビューページでテキストエリアを長押しして「貼り付け」を選択</li>
                        <li>または、手動で入力することも可能です</li>
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    // 既存のメッセージに追加
    const messageElement = document.getElementById('message');
    messageElement.innerHTML += guide;
} 
