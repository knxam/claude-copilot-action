#!/bin/bash
# prepare-oauth.sh - Подготовка OAuth токенов для Claude Code

set -e

# Проверяем, используется ли OAuth
if [[ "$USE_OAUTH" != "true" ]]; then
  echo "OAuth not enabled, skipping preparation"
  exit 0
fi

echo "🔑 Preparing OAuth authentication for Claude Max..."

# Проверяем наличие необходимых переменных
if [[ -z "$CLAUDE_ACCESS_TOKEN" ]] || [[ -z "$CLAUDE_REFRESH_TOKEN" ]] || [[ -z "$CLAUDE_EXPIRES_AT" ]]; then
  echo "❌ Error: OAuth credentials are missing!"
  echo "Required: CLAUDE_ACCESS_TOKEN, CLAUDE_REFRESH_TOKEN, CLAUDE_EXPIRES_AT"
  exit 1
fi

# Создаем директорию для credentials
CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR"

# Создаем файл credentials.json в формате, который ожидает Claude Code
cat > "$CLAUDE_DIR/.credentials.json" << EOF
{
  "access_token": "$CLAUDE_ACCESS_TOKEN",
  "refresh_token": "$CLAUDE_REFRESH_TOKEN",
  "expires_at": "$CLAUDE_EXPIRES_AT"
}
EOF

echo "✅ OAuth credentials prepared successfully"

# Экспортируем переменную окружения для Claude Code
export CLAUDE_AUTH_METHOD="oauth"
echo "CLAUDE_AUTH_METHOD=oauth" >> $GITHUB_ENV

# Проверяем срок действия токена
CURRENT_TIME=$(date +%s)
EXPIRES_AT_SEC=$(date -d "$CLAUDE_EXPIRES_AT" +%s 2>/dev/null || echo "0")

if [[ $EXPIRES_AT_SEC -le $CURRENT_TIME ]]; then
  echo "⚠️ Warning: OAuth token may be expired. Consider refreshing your credentials."
fi

echo "📍 Credentials saved to: $CLAUDE_DIR/.credentials.json"
