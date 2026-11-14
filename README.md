# Speak up AI

英語で話すほどアバターが育ち、詰まってもAIが助けてくれる、大学生向けの会話練習アプリ（MVP）。

## 動かし方

```bash
npm install
npm run dev
```

スマホ実機で試すときは `npm run dev -- --host` で同じWi‑Fiから開く（マイクは HTTPS か localhost でしか使えないので、実機では `vite preview --host` を HTTPS トンネル経由で開くのが確実）。Chrome / Safari 推奨。

## 画面

| パス | 内容 |
| --- | --- |
| `/` | ホーム。アバター（ボイ）・Lv・XP・連続日数・クエスト一覧と直近7日の記録 |
| `/quest/:id` | クエスト詳細。質問の一覧、7日間の記録の付け直し、削除 |
| `/talk/:id` | 会話。AIが英語で質問 → 声で答える。黙っていると 5秒/10秒/15秒 で段階的に助けが出る |
| `/result/:sessionId` | 結果。獲得XP・レベルアップ・シェア画像の書き出し |

Lv10 に到達すると「月約1,500円なら払うか」のアンケートを一度だけ表示し、回答を保存する（検証用）。

## 仕組み（今回はバックエンドなし）

構成図の各役割を、MVPではブラウザ内で代用している。

| 本番の想定 | MVPでの代用 | ファイル |
| --- | --- | --- |
| 音声認識AI | Web Speech API `SpeechRecognition` | `src/hooks/useSpeechRecognition.ts` |
| 音声合成AI | `speechSynthesis` | `src/hooks/useSpeechSynthesis.ts` |
| 無音検知 | マイク音量（Web Audio） | `src/hooks/useSilenceTimer.ts` |
| 会話AI（質問・助け・フィードバック） | 台本 + ルールベース | `src/lib/questContent.ts`, `src/lib/coach.ts` |
| 経験値・レベル計算 | クライアントで計算 | `src/lib/level.ts` |
| データベース | localStorage | `src/lib/repository.ts` |

音声認識が使えないブラウザでは、キーボード入力に自動で切り替わる。

## データ

- 型は `src/types.ts`。`Habit` = 会話クエスト、`Checkin` = その日にそのクエストをやったか（`habit_id` + `date` で1件、押し直すと上書き）
- 加えて `PracticeSession`（1回の練習ログ。XPはここから合計する）と `SurveyResponse`（Lv10アンケート）を持つ
- 保存・読み込みはすべて `src/lib/repository.ts` 経由。Supabase に移すときはこのファイルの中身だけを差し替える

## XP の目安

1問ごとに `10 + 話した単語数（最大30） + 自力ボーナス5`、クエストクリアで +30。
1回（5問・約8分）で 150〜200XP、1日30分〜1時間で約5日で Lv10（3,600XP）に届くよう調整している（`src/lib/level.ts`）。
