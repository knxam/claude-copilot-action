#!/bin/bash
# prepare-oauth.sh - Подготовка OAuth токенов для Claude Code

set -e

# Проверяем, используется ли OAuth
if [[ "$USE_OAUTH" != "true" ]]; then
  echo "OAuth not enabled, skipping preparation"
  exit 0
fi

echo "🔑 Preparing OAuth authentication for Claude Max..."

# Debug информация
echo "Debug: CLAUDE_EXPIRES_AT = $CLAUDE_EXPIRES_AT"

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
  "claudeAiOauth": {
    "accessToken": "$CLAUDE_ACCESS_TOKEN",
    "refreshToken": "$CLAUDE_REFRESH_TOKEN",
    "expiresAt": $CLAUDE_EXPIRES_AT,
    "scopes": ["user:inference", "user:profile"]
  }
}
EOF

echo "✅ OAuth credentials prepared successfully"

# Экспортируем переменную окружения для Claude Code
export CLAUDE_AUTH_METHOD="oauth"
echo "CLAUDE_AUTH_METHOD=oauth" >> $GITHUB_ENV

# Проверяем срок действия токена
CURRENT_TIME=$(date +%s)

# Пробуем разные способы парсинга даты
if [[ "$CLAUDE_EXPIRES_AT" =~ ^[0-9]+$ ]]; then
  # Если это число (timestamp в миллисекундах), конвертируем в секунды
  EXPIRES_AT_SEC=$((CLAUDE_EXPIRES_AT / 1000))
else
  # Если это строка с датой, пробуем распарсить
  EXPIRES_AT_SEC=$(date -d "$CLAUDE_EXPIRES_AT" +%s 2>/dev/null || echo "0")
fi

if [[ $EXPIRES_AT_SEC -eq 0 ]]; then
  echo "⚠️ Warning: Unable to parse expiration date. Token may be expired."
elif [[ $EXPIRES_AT_SEC -le $CURRENT_TIME ]]; then
  echo "⚠️ Warning: OAuth token has expired. Please refresh your credentials."
else
  REMAINING_DAYS=$(( (EXPIRES_AT_SEC - CURRENT_TIME) / 86400 ))
  echo "✅ Token is valid for $REMAINING_DAYS more days"
fi

echo "📍 Credentials saved to: $CLAUDE_DIR/.credentials.json"
