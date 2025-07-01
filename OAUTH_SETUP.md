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
  "claudeAiOauth": {
    "accessToken": "eyJ0eXAiOiJKV1...",
    "refreshToken": "def50200c8e9...",
    "expiresAt": 1751199484945,
    "scopes": ["user:inference", "user:profile"]
  }
}
```

### Шаг 3: Добавьте секреты в GitHub

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте три секрета:
   - Имя: `CLAUDE_ACCESS_TOKEN`, Значение: (ваш accessToken)
   - Имя: `CLAUDE_REFRESH_TOKEN`, Значение: (ваш refreshToken)
   - Имя: `CLAUDE_EXPIRES_AT`, Значение: (число expiresAt, например 1751199484945)

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

### Срок жизни токенов
- **Access Token**: ~30 дней
- **Refresh Token**: ~60 дней

⚠️ **Важно**: Refresh токен также имеет срок жизни! Если вы не обновите токены в течение 60 дней, придется заново логиниться.

У вас есть два варианта:

### Вариант 1: Ручное обновление

1. Запустите `claude` и выполните `/login` снова
2. Получите новые токены из `~/.claude/.credentials.json`
3. Обновите секреты в GitHub

### Вариант 2: Автоматическое обновление (рекомендуется)

Action может автоматически обновлять токены за вас!

#### Настройка автоматического обновления:

1. **Создайте Personal Access Token (PAT)**
   - Перейдите в GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Нажмите "Generate new token (classic)"
   - Дайте токену имя, например "Claude OAuth Refresh"
   - Выберите только разрешение: `repo` (для доступа к секретам)
   - Создайте токен и сохраните его

2. **Добавьте PAT как секрет**
   - Имя: `SECRETS_ADMIN_PAT`
   - Значение: (ваш PAT)

3. **Обновите workflow**
   ```yaml
   - uses: your-org/claude-copilot-action@v1
     with:
       use_oauth: true
       claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
       claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
       claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
       secrets_admin_pat: ${{ secrets.SECRETS_ADMIN_PAT }}
   ```

Теперь токены будут автоматически обновляться, когда истечёт их срок действия!
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

## Устранение проблем

### Ошибка: invalid_grant при обновлении токена

Эта ошибка означает, что refresh token недействителен:

```
Error: Token refresh failed: 400 - {"error": "invalid_grant", "error_description": "Refresh token not found or invalid"}
```

**Причины:**
1. Refresh token истек (обычно через 60 дней)
2. Вы залогинились в Claude где-то еще, и старый токен был отозван
3. Токен в секретах GitHub поврежден или неправильный

**Решение:**
1. Запустите `claude` локально
2. Выполните `/login` для получения новых токенов
3. Обновите ВСЕ три секрета в GitHub новыми значениями

### Ошибка: Token expired

Токены истекли и автоматическое обновление не сработало.

**Решение:**
1. Следуйте инструкциям выше для получения новых токенов
2. Рассмотрите настройку автоматического обновления с SECRETS_ADMIN_PAT

### NaN minutes в логах

Это означает проблему с форматом `CLAUDE_EXPIRES_AT`.

**Решение:**
Убедитесь, что `CLAUDE_EXPIRES_AT` - это число (timestamp в миллисекундах), например: `1751199484945`

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
