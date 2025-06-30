#!/bin/bash
# get-oauth-tokens.sh - Помощник для получения OAuth токенов Claude Max

echo "🔑 Claude Max OAuth Token Helper"
echo "================================"
echo ""
echo "Этот скрипт поможет вам получить OAuth токены для использования"
echo "вашей подписки Claude Max в GitHub Actions."
echo ""

# Проверяем наличие claude
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code не установлен!"
    echo "Установите его командой: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Проверяем файл с credentials
CRED_FILE="$HOME/.claude/.credentials.json"

if [ ! -f "$CRED_FILE" ]; then
    echo "❌ Файл с credentials не найден!"
    echo ""
    echo "Пожалуйста, выполните следующие действия:"
    echo "1. Запустите: claude"
    echo "2. Выполните: /login"
    echo "3. Войдите с вашей подпиской Claude Max"
    echo "4. Запустите этот скрипт снова"
    exit 1
fi

echo "✅ Найден файл с credentials!"
echo ""
echo "📋 Ваши OAuth токены:"
echo "===================="
echo ""

# Читаем и форматируем JSON
if command -v jq &> /dev/null; then
    # Если есть jq, используем его для красивого вывода
    ACCESS_TOKEN=$(jq -r '.access_token' "$CRED_FILE")
    REFRESH_TOKEN=$(jq -r '.refresh_token' "$CRED_FILE")
    EXPIRES_AT=$(jq -r '.expires_at' "$CRED_FILE")
else
    # Иначе используем grep
    ACCESS_TOKEN=$(grep -o '"access_token":\s*"[^"]*"' "$CRED_FILE" | cut -d'"' -f4)
    REFRESH_TOKEN=$(grep -o '"refresh_token":\s*"[^"]*"' "$CRED_FILE" | cut -d'"' -f4)
    EXPIRES_AT=$(grep -o '"expires_at":\s*"[^"]*"' "$CRED_FILE" | cut -d'"' -f4)
fi

echo "CLAUDE_ACCESS_TOKEN:"
echo "$ACCESS_TOKEN"
echo ""
echo "CLAUDE_REFRESH_TOKEN:"
echo "$REFRESH_TOKEN"
echo ""
echo "CLAUDE_EXPIRES_AT:"
echo "$EXPIRES_AT"
echo ""
echo "📝 Инструкции по добавлению в GitHub:"
echo "===================================="
echo ""
echo "1. Откройте ваш репозиторий на GitHub"
echo "2. Перейдите в Settings > Secrets and variables > Actions"
echo "3. Нажмите 'New repository secret'"
echo "4. Добавьте каждый токен как отдельный секрет с именами выше"
echo ""
echo "⚠️  ВАЖНО: Никогда не коммитьте эти токены в репозиторий!"
echo "⚠️  Токены нужно периодически обновлять (обычно раз в месяц)"
echo ""
echo "✨ После добавления секретов вы можете использовать OAuth в workflow!"
