// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyC-SiE6MqrYjBAAr8hiBUHWKWzig8Ng4uI",
  authDomain: "review-system-28767.firebaseapp.com",
  databaseURL: "https://review-system-28767-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "review-system-28767",
  storageBucket: "review-system-28767.firebasestorage.app",
  messagingSenderId: "665404381460",
  appId: "1:665404381460:web:94a45fe7f0a2241b5d0a01"
};

// Firebase の初期化
try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase の初期化が完了しました');
} catch (error) {
  console.error('Firebase の初期化に失敗しました:', error);
}

// Realtime Database の参照を取得
let database;
let reviewsRef;

try {
  database = firebase.database();
  reviewsRef = database.ref('reviews');
  console.log('Firebase Database の参照を取得しました');
} catch (error) {
  console.error('Firebase Database の参照取得に失敗しました:', error);
}

// Firebase データベース操作の関数
const FirebaseDB = {
  // レビューを保存
  saveReview: function(reviewData) {
    console.log('レビューの保存を開始:', reviewData);
    
    if (!reviewsRef) {
      console.error('reviewsRef が未定義です');
      return Promise.reject(new Error('Database reference is not available'));
    }
    
    return reviewsRef.push(reviewData).then((snapshot) => {
      console.log('レビューの保存が完了しました:', snapshot.key);
      return snapshot;
    }).catch((error) => {
      console.error('レビューの保存に失敗しました:', error);
      throw error;
    });
  },

  // 全レビューを取得
  getReviews: function(callback) {
    console.log('レビューの取得を開始');
    
    if (!reviewsRef) {
      console.error('reviewsRef が未定義です');
      return;
    }
    
    reviewsRef.on('value', (snapshot) => {
      const reviews = [];
      snapshot.forEach((childSnapshot) => {
        const review = childSnapshot.val();
        review.id = childSnapshot.key;
        reviews.push(review);
      });
      console.log('レビューを取得しました:', reviews.length + '件');
      callback(reviews);
    }, (error) => {
      console.error('レビューの取得に失敗しました:', error);
    });
  },

  // レビューを削除
  deleteReview: function(reviewId) {
    console.log('レビューの削除を開始:', reviewId);
    
    if (!reviewsRef) {
      console.error('reviewsRef が未定義です');
      return Promise.reject(new Error('Database reference is not available'));
    }
    
    return reviewsRef.child(reviewId).remove().then(() => {
      console.log('レビューの削除が完了しました:', reviewId);
    }).catch((error) => {
      console.error('レビューの削除に失敗しました:', error);
      throw error;
    });
  },

  // 全レビューを削除
  clearAllReviews: function() {
    console.log('全レビューの削除を開始');
    
    if (!reviewsRef) {
      console.error('reviewsRef が未定義です');
      return Promise.reject(new Error('Database reference is not available'));
    }
    
    return reviewsRef.remove().then(() => {
      console.log('全レビューの削除が完了しました');
    }).catch((error) => {
      console.error('全レビューの削除に失敗しました:', error);
      throw error;
    });
  },

  // 一度だけデータを取得（リアルタイムリスナーなし）
  getReviewsOnce: function(callback) {
    console.log('レビューの一度だけ取得を開始');
    
    if (!reviewsRef) {
      console.error('reviewsRef が未定義です');
      return;
    }
    
    reviewsRef.once('value').then((snapshot) => {
      const reviews = [];
      snapshot.forEach((childSnapshot) => {
        const review = childSnapshot.val();
        review.id = childSnapshot.key;
        reviews.push(review);
      });
      console.log('レビューを一度だけ取得しました:', reviews.length + '件');
      callback(reviews);
    }).catch((error) => {
      console.error('レビューの一度だけ取得に失敗しました:', error);
    });
  }
}; 