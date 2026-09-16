# SOKO — сайт студії

- **Сайт:** https://romasokorchuk-create.github.io/SOKOWEBS/
- **Адмінка:** https://romasokorchuk-create.github.io/SOKOWEBS/admin/ — запрацює після підключення Supabase, див. [`supabase/НАЛАШТУВАННЯ.md`](supabase/НАЛАШТУВАННЯ.md)

| Що | Де |
|---|---|
| Сайт (UA / EN / PL) | `index.html` |
| Адмінка: заявки, портфоліо, ціни; вхід пароль + 2FA | `admin/` |
| Підключення Supabase (публічні URL і publishable key) | `config.js` |
| Схема бази з RLS та інструкція | `supabase/` |
| Робочі копії сайтів із портфоліо | `demo/` |
| Довгі скріншоти для перегляду | `works/` |
| Заголовки безпеки (Netlify / Cloudflare Pages) | `_headers` |

Паролів і секретних ключів у репозиторії немає: пароль адміна зберігає Supabase, доступ до даних обмежують правила RLS у базі.
