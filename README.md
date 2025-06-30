# Claude Copilot Action

Переиспользуемый GitHub Action для интеграции Claude Code с GitHub Issues и Pull Requests. Поддерживает множество триггеров: комментарии, лейблы, назначение пользователей.

## 🎉 Новое: Поддержка OAuth для Claude Max

Теперь вы можете использовать свою подписку Claude Max вместо API ключа! Это позволяет использовать Claude в GitHub Actions без дополнительных затрат на API.

## 🚀 Быстрый старт

### Вариант 1: С API ключом Anthropic

```yaml
name: Claude Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned, labeled]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/claude-copilot-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Вариант 2: С подпиской Claude Max (OAuth)

```yaml
jobs:
  claude-response:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/claude-copilot-action@v1
        with:
          use_oauth: true
          claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
          claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
          claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

## 📋 Возможности

- **Множество триггеров**: комментарии с `@claude`, лейблы, назначение задач
- **Автоматическое создание PR**: при назначении issue автоматически создается ветка и PR
- **Работа в контексте**: Claude понимает контекст issue/PR и работает в правильной ветке
- **Гибкая настройка**: поддержка Anthropic API, AWS Bedrock, Google Vertex AI, и теперь OAuth
- **Визуальная обратная связь**: реакции 👀 и комментарии о прогрессе
- **OAuth поддержка**: используйте вашу подписку Claude Max без дополнительных затрат

## 🔐 Настройка OAuth для Claude Max

Если у вас есть подписка Claude Max, вы можете использовать её вместо API ключа:

### 1. Получите OAuth credentials

1. Убедитесь, что вы залогинены в Claude Code с вашей подпиской Claude Max:
   ```bash
   claude
   /status  # Должно показать: Login Method: Claude Max Account (5x)
   /login   # Если не залогинены
   ```

2. Найдите ваши credentials в файле `~/.claude/.credentials.json`:
   ```json
   {
     "access_token": "...",
     "refresh_token": "...",
     "expires_at": "..."
   }
   ```

### 2. Добавьте секреты в GitHub

В настройках репозитория (Settings > Secrets and variables > Actions) добавьте:
- `CLAUDE_ACCESS_TOKEN` - значение access_token
- `CLAUDE_REFRESH_TOKEN` - значение refresh_token
- `CLAUDE_EXPIRES_AT` - значение expires_at

### 3. Используйте OAuth в workflow

```yaml
- uses: your-org/claude-copilot-action@v1
  with:
    use_oauth: true
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

⚠️ **Важно**: OAuth токены нужно периодически обновлять. Следите за сроком действия токена.

📖 **[Подробное руководство по настройке OAuth](./OAUTH_SETUP.md)**

## 🔧 Параметры

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `anthropic_api_key` | API ключ Anthropic (не нужен при OAuth) | - |
| `use_oauth` | Использовать OAuth вместо API ключа | `false` |
| `claude_access_token` | OAuth access token (при use_oauth) | - |
| `claude_refresh_token` | OAuth refresh token (при use_oauth) | - |
| `claude_expires_at` | Срок действия OAuth токена | - |
| `github_token` | GitHub токен с правами на repo и PR | `${{ github.token }}` |
| `trigger_phrase` | Фраза для активации в комментариях | `@claude` |
| `label_trigger` | Лейбл для активации | `claude` |
| `assignee_trigger` | Имя пользователя для активации | - |
| `model` | Модель Claude | `claude-3-5-sonnet-20241022` |
| `max_turns` | Максимальное количество итераций | `20` |
| `timeout_minutes` | Таймаут в минутах | `30` |
| `allowed_tools` | Разрешенные инструменты | См. ниже |
| `custom_instructions` | Дополнительные инструкции | - |
| `claude_env` | Переменные окружения (YAML) | - |
| `use_bedrock` | Использовать AWS Bedrock | `false` |
| `use_vertex` | Использовать Google Vertex AI | `false` |
| `base_branch` | Базовая ветка для новых веток | default branch |
| `branch_prefix` | Префикс для веток Claude | `claude/` |

### Allowed Tools

По умолчанию включены базовые инструменты:
```
Bash(git:*),
View,
Edit,
GlobTool,
GrepTool,
BatchTool
```

Для расширенной функциональности добавьте:
```yaml
allowed_tools: |
  Bash(git:*),
  Bash(npm:*),
  Bash(python:*),
  View,
  Edit,
  GlobTool,
  GrepTool,
  BatchTool,
  mcp__github_file_ops__read_file,
  mcp__github_file_ops__commit_files
```

## 📚 Примеры использования

### Базовая конфигурация

```yaml
- uses: your-org/claude-copilot-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### С кастомным триггером

```yaml
- uses: your-org/claude-copilot-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    trigger_phrase: "/ai"
    label_trigger: "ai-task"
```

### С AWS Bedrock

```yaml
- uses: your-org/claude-copilot-action@v1
  with:
    use_bedrock: true
    model: "anthropic.claude-3-5-sonnet-20241022-v2:0"
```

### С дополнительными инструкциями

```yaml
- uses: your-org/claude-copilot-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    custom_instructions: |
      - Всегда добавляй тесты для нового кода
      - Используй TypeScript strict mode
      - Следуй стайл-гайду проекта
```

### С переменными окружения

```yaml
- uses: your-org/claude-copilot-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_env: |
      NODE_ENV: development
      API_URL: https://api.example.com
      DEBUG: true
```

## 🎯 Сценарии использования

### 1. Автоматизация задач через лейблы

1. Создайте issue с описанием задачи
2. Добавьте лейбл `claude`
3. Claude автоматически:
   - Создаст ветку
   - Откроет PR
   - Реализует изменения

### 2. Интерактивная разработка

1. В любом PR напишите комментарий: `@claude добавь валидацию входных данных`
2. Claude внесет изменения в текущую ветку PR

### 3. Code Review

```
@claude проверь этот код на безопасность и производительность
```

### 4. Назначение задач

Назначьте issue на пользователя `claude` (если настроен `assignee_trigger`)

## 🔒 Безопасность

- Action работает в изолированном окружении
- Требует явного разрешения прав через `permissions`
- Поддерживает OIDC для AWS/GCP
- Не может изменять файлы в `.github/workflows`

## 🛠️ Разработка

### Структура

```
claude-copilot-action/
├── action.yml          # Определение action
├── README.md          # Документация
├── LICENSE            # Лицензия
└── tests/             # Тесты
```

### Тестирование локально

```bash
# Установите act
brew install act  # macOS
# или
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Запустите тест
act -j claude-response --secret-file .env.test
```

## 📝 Лицензия

MIT

## 🤝 Вклад

Приветствуются PR и issues! Пожалуйста, прочитайте CONTRIBUTING.md перед созданием PR.
