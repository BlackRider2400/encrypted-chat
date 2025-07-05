# Projekt Bazy Danych 2

## Zespół 24
Krzysztof Barałkiewicz, Marek Dzięcioł, Jakub Jurczak, Wiktor Kruk, Jakub Mieczkowski

## Temat projektu

Tematem projektu jest komunikator umożliwiający czatowanie ze znajomymi przez internet. Dodatkowa funkcjonalność to enkrypcja wiadomości end-to-end.

## Technologie użyte

- React (Frontend)
- NodeJS (WebSocket)
- ASP.net (Backend)
- PostgreSQL (Baza danych)

## Model ER bazy danych

![](./ER_diagram.png)

## Opis funkcji aplikacji webowej

**1. Logowanie**

![](./login.png)

Po otworzeniu witryny wyświetla się opcja zalogowania użytkownika, należy wpisać email oraz hasło.

**2. Rejestracja użytkownika**

![](./register.png)

Kliknięcie w przycisk "Create account" przełącza widok z logowania na rejestracje. Aby utworzyć konto wystarczy uzupełnić powyższe pola.

**3. Lista czatów / menu główne**

![](./list.png)

Po zalogowaniu/utworzeniu konta wyświetla się lista ostatnich czatów. Po prawej stronie wyświetla się ilość nieprzeczytanych wiadomości oraz możliwość usunięcia czatu.

![](./search.png)

Można również wyszukać innych uzytkowników do czatowania.

**4. Prywatne czaty**

![](./chat.png)

Funkcjonalność jest podobna do popularnych komunikatorów, np. Messenger lub WhatsApp. Za pomocą "X" można usuwać wiadomości po obu stronach.

## Szyfrowanie

Każdy z użytkowników w trakcie rejestracji otrzymuje dwa klucze do szyfrowania hybrydowego. Obejmuje ono enkrypcję danych konwersacji - dopiero przy wyświetlaniu na ekranie są one odszyfrowywane.

> {
    "id": 4,
    "name": "ajax",
    "publicKey": "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAg2Wb5+i22vqAS8xaBuCcYPBjsSFrWDNjcQNDIv/iWq9DIptezCQU\nBWYtiD8RiBKjkICyIbpXk2yzslQ+WJ0k9VxxtWuEnXWUU5v1BxO8/2E9wTjgWL9r\nr9CJRUAPpdtkM68LX0GSRK531dIYn/kgm/IHsgOR4ZzRDM4XDPdsBuTEDnJHDcm+\nBuKevE1pPHIj9V4RZZ5A/GFJ/j9gBUJWU9L3363jkIGDoA5t4eRu//c4uIMa9+gf\nbzxjzkIMXQfu5vekpAzeSg+14xtuXiJbSPg6ZkGsmlH8SpCLX2RYA7iLwlR/VFxE\n02cE854Gcc+IAf0IO6k0KWcnCb+KxhTWfwIDAQAB\n-----END RSA PUBLIC KEY-----",
    "privateKey": "-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIFJTBfBgkqhkiG9w0BBQ0wUjAxBgkqhkiG9w0BBQwwJAQQgU8k8K+4vplayb/E\nZJFwGAICJxAwDAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEEI8gPbaC8K4lrJqq\nYN84lO0EggTAXRn191Li9c862yl40WGO6wBBmIK85g82Bz2tbnjS9N2cCQ1k6uiu\nWhXQa5IFErBV14fLFzI496uZsq3LQ2C9/ct58RKzO2jRSE0IlxeJWA9jIr5RIemU\nteoExf+c2r145GGSfTsazf9G4IUCDT160f9VbqB1Y9WrUcwhyqO08WFSK3BPo/05\nkVU28FOqH5MsHt11acwr48NQymZHMZeLlfwmADSnK0RZ44t2rnRE3TJN8SMJS2gu\nWju7Ip6XvxNMqlqqzZV1Y2PcYm9Anx63iopFu9kNG6EDsILdczVpXBk+6MMBdb2n\nMjArR758KiIl4w4fn3QKAA7Rl4MHzhVKF8BUzdD5o6umkwiQQWTzT9WRQbJGESRY\nAzGMP1WaNIkNQuMBSHmESrMe5Ph/99dP8xdC2rKzsBg8mMJEhIMQOsC88PsuPT/b\noy22ejhF+28g2XrGD3AEzb+0M2fQie/EJ3xvAZxBh/Q2tE11lnQHR+GVxF0jr6FC\nWBC+QbKmkw0ClhHuRZQfgsGFtMD+WEQEILP9o2PTPFxH4aFhnlFZLCnm/Q4ewbkF\nclN7j5mPUhWMLOw8G4c7rMiu5O7eWjEV1eLRD5MR9dH8RboDTCV2REY03msb2Rex\nOYS0V7yHKwC3t9vMPDNk5NKhDlyKRZ22GT6mvNUbaRuxPSfyBa7MtWZIZQBqyhFA\nrh/FoftMUNpvvpKNTzbabmQY+im30FtWccg2bqRfsFc0h+5eOLPkOaEWQDDxpsxW\nGMvOUrIA+pcjN8KOCruhkj2VxBSYimiKgvyCzJJFi3R1KjSazgeOIp5usBuu9Fg6\nAlz6qI5ahuFCkV5+TW0FfLoheA6KLqoEKOJt0nVGG5jLJ0dcBzf20Y/0tLPN7wO1\n/qD3c2D6qwmK7YmOB2GMMYYxPPWsyUR3qzu/Zt+NQ+y2f2ALWHs6/adbO/kNdjJ/\nfDUxvyvYDy+X+xA870xwyRzckXllMaSwZvfz9w3ykR8Sj97F9oicT2Z6YB0Chkvl\ncI/dYjPLeuCe8liYNAc+n+1ySRjfMB7erkf6fXbDVNF+cMMAXfYiPT1hvZYZJW71\n/8qigJYVxzyVYCqcbX+qYeVhdtuCcLHRXlaTIp5MstZ78iTFZZPOYJdL+UKfsPaN\ngowCKpZePX0gEO0S+IeC5ox7fFPjpxpAJUOZ9Gtw2M+gQ18scNPuMTBrJWCChN4R\n5pAnDIORvqumsEJfNDd9KdQVQ/5q0Z/H8hsE4ar0kGQSo/wRSA7WhAysMiGgF3Ez\nd8BpZio3CyplmOeKkP0NMoiG8Y1QYVvdvkC/TL66p7yPT5Ii83MaXDoH34xVhNE1\nGCNuzjq/DeMz1o7pCm9lfjZ+Bm+cayfo40N6w95xMC5MgBwY+JV7B86kYUkR90S+\nigNs377peg0u0WTnpY7IcdlfEYvfoR9F8XDT2xIj4fGBbORDpd+ldeGapH/NEThG\n66DE931SCuf/yTNNeQZKyjPRk2wqYH/TayDbW7OZoZzZLlmnqtxZ2+d1cjU+hd5Q\npZrXLNT6XeyTHJvCUIiFGl8h/IbBeG1GHWLA6vpzsExh+ZW4Cto4VAQPAZMxno43\nl921jIyTV47ivuI61D0EpDyFcixIRhHxHw==\n-----END ENCRYPTED PRIVATE KEY-----",
    "createdAt": "2025-06-22T20:08:25.149492Z"
}

*Otrzymywane informacje o zalogowanym użytkowniku.*

>{
        "id": 225,
        **"content": "8nEvgYjc/FJDimdm+opcbrbv2KFcIi/e/tLGeJhtHL4="**,
        "conversationId": 19,
        "conversationName": "wiktor3 ajax",
        "author": {
            "id": 4,
            "name": "ajax",
            "publicKey": "",
            "createdAt": "2025-06-22T20:08:25.149492Z"
        },
        "timestamp": "2025-06-22T20:52:30.497351Z"
    },
    {
        "id": 224,
        **"content": "pHUBlTREKz3jJm5PmQOVWTweBH3M5cgHyIc2OQaZHou61+rtPXGf5gexSQ=="**,
        "conversationId": 19,
        "conversationName": "wiktor3 ajax",
        "author": {
            "id": 6,
            "name": "wiktor3",
            "publicKey": "",
            "createdAt": "2025-06-22T20:44:53.296901Z"
        },
        "timestamp": "2025-06-22T20:51:55.546531Z"
    },

*Przykładowe zaszyfrowane **bloki** z konwersacji*

## Frontend

Do szyfrowania wykorzystana została biblioteka *node-forge*.
Ma on dwie strony *login* oraz *chatapp*.

Chatapp składa się z *ChatList* oraz *ChatRoom*.

Wiadomości w *ChatRoom* wykorzystują lazy loading (na start tylko 50 wiadomości, a jak przewinie się wyżej to ładuje więcej).

Styl i wygląd jest zrobiony za pomocą *tailwindcss*.

## WebSocket
Prosty serwer służący do obsługi websocketa do wysyłania wiadomości. Dostaje informacje od Frontedu, że ktoś wysłał wiadomość do kogoś i jak ktoś inny obecnie ogląda wiadomości to dostaje informacje z websocketa, że powinien pobrać wiadomości.

Służy do szybszego bardziej efektywnego obsługiwania odświeżania wiadomości.
