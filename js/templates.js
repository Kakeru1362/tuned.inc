// タスクテンプレート集
// offset: 基準日からの日数（期限の自動計算に使用）
const TASK_TEMPLATES = Object.freeze([
  {
    category: 'Webサイト制作',
    tasks: [
      { title: '要件ヒアリング', offset: 3, priority: '高' },
      { title: 'サイトマップ・構成案作成', offset: 7, priority: '高' },
      { title: 'ワイヤーフレーム作成', offset: 10, priority: '中' },
      { title: 'デザインカンプ作成', offset: 17, priority: '高' },
      { title: 'デザインのクライアント確認', offset: 21, priority: '高' },
      { title: 'コーディング・実装', offset: 31, priority: '高' },
      { title: '原稿・素材の受領', offset: 24, priority: '中' },
      { title: 'テスト・動作確認', offset: 35, priority: '中' },
      { title: '本番公開', offset: 38, priority: '高' },
      { title: '公開後の最終チェック', offset: 40, priority: '低' }
    ]
  },
  {
    category: 'LP・広告',
    tasks: [
      { title: '訴求・ターゲット整理', offset: 3, priority: '高' },
      { title: '構成・ワイヤー作成', offset: 6, priority: '高' },
      { title: 'ファーストビュー制作', offset: 10, priority: '高' },
      { title: 'LP全体デザイン', offset: 14, priority: '中' },
      { title: 'コーディング', offset: 18, priority: '中' },
      { title: '広告クリエイティブ作成', offset: 14, priority: '中' },
      { title: '計測タグ設置・確認', offset: 19, priority: '中' },
      { title: 'クライアント最終確認', offset: 21, priority: '高' },
      { title: '広告配信開始', offset: 23, priority: '高' },
      { title: '配信1週間後の効果確認', offset: 30, priority: '中' }
    ]
  },
  {
    category: 'SNS運用（月次）',
    tasks: [
      { title: '月間投稿カレンダー作成', offset: 3, priority: '高' },
      { title: '投稿素材の撮影・収集', offset: 7, priority: '中' },
      { title: '投稿文・画像の作成（前半分）', offset: 10, priority: '中' },
      { title: '投稿文・画像の作成（後半分）', offset: 20, priority: '中' },
      { title: 'コメント・DM対応の確認', offset: 15, priority: '低' },
      { title: '月次レポート作成', offset: 28, priority: '高' },
      { title: 'クライアント定例ミーティング', offset: 30, priority: '中' }
    ]
  },
  {
    category: 'EC運用',
    tasks: [
      { title: '商品登録・更新', offset: 3, priority: '中' },
      { title: '商品撮影の手配', offset: 7, priority: '中' },
      { title: '在庫・受注状況の確認', offset: 5, priority: '高' },
      { title: 'セール・キャンペーン企画', offset: 10, priority: '中' },
      { title: 'バナー・特集ページ更新', offset: 14, priority: '中' },
      { title: '売上レポート作成', offset: 28, priority: '高' }
    ]
  },
  {
    category: '営業・提案',
    tasks: [
      { title: 'アポイント調整', offset: 2, priority: '高' },
      { title: 'ヒアリングシート準備', offset: 4, priority: '中' },
      { title: '提案書ドラフト作成', offset: 7, priority: '高' },
      { title: '見積書作成', offset: 8, priority: '高' },
      { title: '提案プレゼン実施', offset: 10, priority: '高' },
      { title: 'フォローアップ連絡', offset: 14, priority: '中' },
      { title: '契約書の取り交わし', offset: 21, priority: '高' }
    ]
  },
  {
    category: '定例・庶務',
    tasks: [
      { title: '週次ミーティング資料準備', offset: 2, priority: '中' },
      { title: '月次請求書の発行', offset: 5, priority: '高' },
      { title: '経費精算の取りまとめ', offset: 7, priority: '低' },
      { title: '進捗報告書の提出', offset: 7, priority: '中' },
      { title: '次月スケジュール調整', offset: 25, priority: '中' }
    ]
  }
]);
