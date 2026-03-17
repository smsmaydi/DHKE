# GitHub'a push adımları

## 1. GitHub'da yeni repository oluştur

1. [github.com](https://github.com) → giriş yap
2. Sağ üst **+** → **New repository**
3. **Repository name:** örn. `DHKE` veya `dhke-simulation`
4. **Description:** (isteğe bağlı) "Diffie-Hellman Key Exchange simulation"
5. **Public** veya **Private** seç
6. **README, .gitignore, license ekleme** — projede zaten dosyalar var, hepsini işaretleme
7. **Create repository** tıkla

Oluşan sayfada şuna benzer bir URL görürsün:
`https://github.com/KULLANICI_ADIN/DHKE.git`

---

## 2. Bilgisayarında Git ile bağla ve push et

Proje klasöründe **Terminal** veya **PowerShell** aç (örn. `c:\Users\sfydn\Desktop\Tez\DHKE`).

Sırayla şu komutları çalıştır (Git kurulu olmalı):

```bash
# Projeyi git repo yap
git init

# Tüm dosyaları ekle (.gitignore’dakiler hariç)
git add .

# İlk commit
git commit -m "Initial commit: DHKE simulation (React + vanilla JS)"

# GitHub’daki repo’yu “origin” olarak ekle (URL’yi kendi reponla değiştir)
git remote add origin https://github.com/KULLANICI_ADIN/DHKE.git

# Varsayılan branch adı (GitHub’ın beklediği)
git branch -M main

# İlk push
git push -u origin main
```

**Not:** `KULLANICI_ADIN` ve `DHKE` kısımlarını kendi GitHub kullanıcı adın ve repo adınla değiştir.

---

## 3. İlk push’ta kimlik sorması

- **HTTPS** kullanıyorsan: GitHub kullanıcı adı + **Personal Access Token** (şifre yerine) isteyebilir.  
  Token: GitHub → **Settings** → **Developer settings** → **Personal access tokens** → yeni token oluştur.
- **SSH** kullanmak istersen: `git remote add origin git@github.com:KULLANICI_ADIN/DHKE.git` şeklinde ekleyip SSH key’ini GitHub’a tanımlaman gerekir.

Bu adımlardan sonra kodun GitHub’da görünür olur.
