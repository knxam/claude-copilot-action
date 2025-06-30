# OAuth Setup Guide для Claude Copilot Action

Это руководство поможет вам настроить OAuth аутентификацию для использования вашей подписки Claude Max в GitHub Actions.

## Преимущества OAuth

- ✅ Используйте вашу существующую подписку Claude Max
- ✅ Не нужно платить за API отдельно
- ✅ Все возможности Claude Max доступны в GitHub Actions
- ✅ Простая настройка

## Требования

- Активная подписка Claude Max
- Установленный Claude Code локально
- Доступ администратора к GitHub репозиторию

## Пошаговая инструкция

### Шаг 1: Войдите в Claude Code

```bash
# Запустите Claude Code
claude

# Проверьте статус
/status

# Вы должны увидеть:
# Login Method: Claude Max Account (5x)

# Если не залогинены, выполните:
/login
```

### Шаг 2: Получите OAuth токены

#### Вариант А: Используйте наш скрипт

```bash
# Скачайте и запустите скрипт
curl -O https://raw.githubusercontent.com/your-org/claude-copilot-action/main/scripts/get-oauth-tokens.sh
chmod +x get-oauth-tokens.sh
./get-oauth-tokens.sh
```

#### Вариант Б: Вручную

```bash
# Откройте файл с credentials
cat ~/.claude/.credentials.json

# Вы увидите что-то вроде:
{
  "access_token": "eyJ0eXAiOiJKV1...",
  "refresh_token": "def50200c8e9...",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Шаг 3: Добавьте секреты в GitHub

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте три секрета:
   - Имя: `CLAUDE_ACCESS_TOKEN`, Значение: (ваш access_token)
   - Имя: `CLAUDE_REFRESH_TOKEN`, Значение: (ваш refresh_token)
   - Имя: `CLAUDE_EXPIRES_AT`, Значение: (ваш expires_at)

### Шаг 4: Настройте workflow

```yaml
name: Claude Assistant with OAuth
on:
  issue_comment:
    types: [created]
  issues:
    types: [labeled]

jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/claude-copilot-action@v1
        with:
          use_oauth: true
          claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
          claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
          claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

## Обновление токенов

OAuth токены обычно действительны около месяца. Когда они истекут:

1. Запустите `claude` и выполните `/login` снова
2. Получите новые токены из `~/.claude/.credentials.json`
3. Обновите секреты в GitHub

## Автоматизация обновления токенов

Вы можете создать GitHub Action для напоминания об обновлении:

```yaml
name: OAuth Token Reminder
on:
  schedule:
    - cron: '0 0 1 * *'  # Первого числа каждого месяца

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create reminder issue
        uses: actions/github-script@v7
        with:
          script: |
            const expires = '${{ secrets.CLAUDE_EXPIRES_AT }}';
            const expiryDate = new Date(expires);
            const now = new Date();
            
            if (expiryDate - now < 7 * 24 * 60 * 60 * 1000) {
              await github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: '🔑 Claude OAuth токены скоро истекут',
                body: 'Пожалуйста, обновите OAuth токены для Claude Max.\n\nТекущий срок истечения: ' + expires,
                labels: ['maintenance']
              });
            }
```

## Troubleshooting

### Ошибка: OAuth credentials are missing!

Убедитесь, что все три секрета добавлены правильно:
- CLAUDE_ACCESS_TOKEN
- CLAUDE_REFRESH_TOKEN  
- CLAUDE_EXPIRES_AT

### Ошибка: Token expired

Токены истекли. Обновите их:
1. `claude` → `/login`
2. Получите новые токены
3. Обновите секреты в GitHub

### Claude не отвечает

Проверьте:
- Правильно ли установлен `use_oauth: true`
- Все ли секреты добавлены
- Не истек ли токен

## Безопасность

- ⚠️ **НИКОГДА** не коммитьте токены в репозиторий
- ⚠️ Используйте только GitHub Secrets
- ⚠️ Не делитесь токенами с другими
- ⚠️ Один набор токенов = один пользователь

## FAQ

**Q: Можно ли использовать один набор токенов для нескольких репозиториев?**
A: Да, но помните, что это ваша личная подписка. Не злоупотребляйте.

**Q: Что произойдет, когда токены истекут?**
A: Claude перестанет работать. Нужно обновить токены.

**Q: Это официально поддерживается Anthropic?**
A: Нет, но это работает с текущей версией Claude Code.

**Q: Могу ли я использовать это в публичном репозитории?**
A: Да, токены хранятся в секретах и не видны публично.
