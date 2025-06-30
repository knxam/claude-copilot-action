#!/bin/bash

# Скрипт для локального тестирования GitHub Action с помощью act
# Требует установки: https://github.com/nektos/act

# Проверяем наличие act
if ! command -v act &> /dev/null; then
    echo "❌ act не установлен. Установите с https://github.com/nektos/act"
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f .env.test ]; then
    echo "❌ Создайте .env.test файл на основе .env.example"
    exit 1
fi

# Тестовые данные для PR
export TEST_PR_BODY="This PR was automatically created in response to labeling issue #123"
export TEST_ISSUE_NUMBER="123"
export TEST_BRANCH="claude/issue-123-test-1"

echo "🧪 Запуск локального теста Claude Agent..."
echo "📋 Тестируем с issue #${TEST_ISSUE_NUMBER}"

# Запускаем act с эмуляцией события pull_request
act pull_request \
  -j claude-agent \
  --secret-file .env.test \
  --env PR_BODY="$TEST_PR_BODY" \
  --env ISSUE_NUMBER="$TEST_ISSUE_NUMBER" \
  --env BRANCH_NAME="$TEST_BRANCH" \
  -P ubuntu-latest=catthehacker/ubuntu:act-latest

echo "✅ Тест завершен"
