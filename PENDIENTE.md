# 📝 TAREAS PENDIENTES - OMNI HUD

Este documento detalla los pasos finales para dejar el proyecto funcionando con el instalador ligero y el acceso de administrador.

---

## 1. 📦 Generar el Instalador Ligero (Inno Setup)
Como la compilación optimizada ya está lista en `code/Omni/dist/Omni_HUD`, solo falta empaquetarla:

1. Abre el programa **Inno Setup Compiler**.
2. Abre el archivo: `C:\Users\randy\code\Omni\omni_installer.iss`.
3. Presiona **CTRL + F9** (o el botón de Play azul) para compilar.
4. El instalador se generará en: `C:\Users\randy\code\Omni\setup\Omni_HUD_Setup.exe`.

## 2. 🌐 Actualizar el Instalador en la Web
Una vez generado el archivo anterior, cópialo a la carpeta pública de la web:

1. Copia `Omni_HUD_Setup.exe` desde `code/Omni/setup/`.
2. Pégalo en `code/omni-web/public/` (reemplaza el anterior si existe).

## 3. 🔑 Activar tu Acceso de Dueño (Supabase)
Si aún no tienes acceso al Dashboard o a la App, ejecuta esto en el **SQL Editor** de Supabase:

```sql
INSERT INTO public.profiles (id, email, plan, purchase_id)
SELECT id, email, 'architect', 'OWNER_ACCESS'
FROM auth.users 
WHERE email = 'randy6grullon@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET plan = 'architect', purchase_id = 'OWNER_ACCESS';
```

## 4. 🚀 Iniciar Proyectos Locales

### Aplicación de Escritorio:
```powershell
cd code/Omni
.venv/Scripts/python main.py
```

### Aplicación Web:
```powershell
cd code/omni-web
npm run dev
```

---
**Nota:** El archivo `gui.py` y `main.py` ya están corregidos y optimizados para validar el plan del usuario.
