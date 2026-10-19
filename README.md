# Mini Minecraft Mobile（簡略版）

スマホブラウザで遊べる、マインクラフト風の**簡略版3Dブロックゲーム**です。

## 遊び方

- 左下の仮想スティック: 移動
- 画面スワイプ: 視点移動
- 画面タップ: ブロック破壊
- 右下「設置」ボタン: ブロック設置

## ローカル起動

`index.html` をブラウザで開くだけでも動きますが、
ローカルサーバー経由が安定です。

例（Python）:

```bash
python -m http.server 8080
```

その後、`http://localhost:8080` を開いてください。

## GitHub Pages で公開

1. GitHub リポジトリの **Settings** → **Pages**
2. Source を `Deploy from a branch` にする
3. Branch を `main` / `/ (root)` にして Save
4. 数分待つと公開 URL が発行されます

## これは簡略版です

未実装（今後拡張候補）:

- インベントリ
- 複数ブロック種類の選択
- ジャンプ / 重力 / 当たり判定の強化
- セーブ/ロード
- 手続き的な地形生成
