# 📧 Email Automation Guide — OMNI HUD

## Proveedor recomendado: [Resend](https://resend.com)

Resend es la opción más simple de integrar con Next.js. Tiene SDK oficial, plan gratuito (3,000 emails/mes) y se integra en minutos.

---

## 1. Setup inicial

```bash
npm install resend
```

Agrega tu API key en `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Crea el helper en `src/lib/email.ts`:
```typescript
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY);
```

> [!IMPORTANT]
> Necesitas verificar tu dominio en Resend para enviar desde `no-reply@tudominio.com`. Sin ello solo puedes enviar desde `onboarding@resend.dev` (solo para testing).

---

## 2. Emails a implementar

### 📬 A. Bienvenida al comprar un plan
**Cuándo:** después de `handlePaymentSuccess` en `checkout/page.tsx`  
**Ruta API:** `POST /api/email/welcome`

```typescript
// src/app/api/email/welcome/route.ts
import { NextResponse } from 'next/server';
import { resend } from '@/lib/email';

export async function POST(req: Request) {
  const { email, name, plan, keyText, expiresAt } = await req.json();
  
  await resend.emails.send({
    from: 'OMNI HUD <no-reply@tudominio.com>',
    to: email,
    subject: '⚡ Tu Neural Key está activa',
    html: `
      <div style="background:#0D0D0D;color:#fff;font-family:monospace;padding:40px;border-radius:16px">
        <h1 style="color:#00FF41">Bienvenido, ${name}</h1>
        <p>Tu plan <strong>${plan.toUpperCase()}</strong> está activo.</p>
        <div style="background:#111;border:1px solid #00FF41;padding:16px;border-radius:8px;margin:20px 0">
          <code style="color:#00FF41;font-size:14px">${keyText}</code>
        </div>
        <p style="color:#666">Válido hasta: ${new Date(expiresAt).toLocaleDateString()}</p>
        <a href="https://tudominio.com/dashboard" style="background:#00FF41;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">IR AL DASHBOARD →</a>
      </div>
    `
  });
  
  return NextResponse.json({ ok: true });
}
```

**Llamarlo desde `checkout/page.tsx`** después del update de profile:
```typescript
await fetch('/api/email/welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: user.email,
    name: profile?.first_name || user.email,
    plan: planType,
    keyText: purchaseId,
    expiresAt: isoExpires
  })
});
```

---

### ⏰ B. Alerta de expiración (7 días antes)
**Cuándo:** cron job diario  
**Ruta API:** `POST /api/cron/expiry-reminder` (protegida con `CRON_SECRET`)

```typescript
// src/app/api/cron/expiry-reminder/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Verificar el secret del cron
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const today = new Date();
  
  // Buscar keys que expiran en exactamente 7 días
  const { data: expiringKeys } = await supabase
    .from('profiles')
    .select('email, first_name, plan, plan_expires_at')
    .gt('plan_expires_at', today.toISOString())
    .lt('plan_expires_at', in7Days.toISOString())
    .not('purchase_id', 'is', null);
  
  let sent = 0;
  for (const user of expiringKeys ?? []) {
    await resend.emails.send({
      from: 'OMNI HUD <no-reply@tudominio.com>',
      to: user.email,
      subject: '⚠️ Tu plan expira en 7 días',
      html: `
        <div style="background:#0D0D0D;color:#fff;font-family:monospace;padding:40px">
          <h2 style="color:#F59E0B">Aviso de expiración</h2>
          <p>Hola ${user.first_name}, tu plan <strong>${user.plan}</strong> expira el 
          <strong>${new Date(user.plan_expires_at).toLocaleDateString()}</strong>.</p>
          <a href="https://tudominio.com/checkout?plan=${user.plan}&renew=true" 
             style="background:#F59E0B;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            RENOVAR AHORA →
          </a>
        </div>
      `
    });
    sent++;
  }
  
  return NextResponse.json({ sent });
}
```

---

### 📨 C. Email manual desde el Admin
Se implementa como parte del Admin CMS (ver componente `EmailComposer`).  
Usa la misma ruta API `/api/admin/email` con el admin email en el header.

---

## 3. Configurar el Cron Job (Vercel)

En `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expiry-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Y en `.env.local`:
```env
CRON_SECRET=un_string_secreto_muy_largo
```

> [!TIP]
> El cron de Vercel llama a la ruta con el header `Authorization: Bearer <CRON_SECRET>`. Sin el secret, cualquiera podría disparar el cron.

---

## 4. En desarrollo (testing)

Para probar sin un dominio verificado, usa la dirección de prueba de Resend:
```typescript
to: 'delivered@resend.dev' // Siempre entrega sin enviar de verdad
```

O instala [MailHog](https://github.com/mailhog/MailHog) localmente para capturar emails.

---

## 5. Resumen de variables de entorno necesarias

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
CRON_SECRET=mi_secreto_del_cron
```
