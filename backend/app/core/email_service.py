import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from app.core.config import settings

def generate_otp() -> str:
    """Génère un code OTP à 6 chiffres"""
    return str(random.randint(100000, 999999))

def send_email(to_email: str, subject: str, body: str, html: bool = True):
    """Fonction générique pour envoyer un email via SMTP"""
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print("❌ Email non configuré dans le fichier .env")
        return

    msg = MIMEMultipart()
    msg['From'] = f"HelpDesk IA <{settings.SMTP_EMAIL}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    
    content_type = 'html' if html else 'plain'
    msg.attach(MIMEText(body, content_type))

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email envoyé à {to_email}")
    except Exception as e:
        print(f"❌ Erreur d'envoi d'email: {e}")

# --- FONCTIONS SPÉCIFIQUES PRÊTES À L'EMPLOI ---

def send_otp_login_email(to_email: str, first_name: str, otp: str):
    """Envoie un bel email HTML avec le code OTP de connexion"""
    subject = "Votre code de connexion HelpDesk IA"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <div style="background: #2563eb; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">HelpDesk IA</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd;">
            <h2>Connexion à votre espace</h2>
            <p>Bonjour {first_name},</p>
            <p>Vous avez demandé à vous connecter à votre tableau de bord. Voici votre code de vérification (OTP) :</p>
            <h1 style="font-size: 36px; color: #2563eb; letter-spacing: 5px; text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">{otp}</h1>
            <p style="text-align: center; color: #666;"><strong>Ce code expirera dans 5 minutes.</strong></p>
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </body>
    </html>
    """
    send_email(to_email, subject, body, html=True)

def send_password_reset_email(to_email: str, otp: str):
    """Envoie un email HTML avec le code OTP pour réinitialiser le mot de passe"""
    subject = "Réinitialisation de votre mot de passe"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <div style="background: #dc2626; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">HelpDesk IA</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd;">
            <h2>Mot de passe oublié</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous pour poursuivre :</p>
            <h1 style="font-size: 36px; color: #dc2626; letter-spacing: 5px; text-align: center; background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">{otp}</h1>
            <p style="text-align: center; color: #666;"><strong>Ce code expirera dans 10 minutes.</strong></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </body>
    </html>
    """
    send_email(to_email, subject, body, html=True)

def send_ticket_assignment_email(to_email: str, tech_name: str, ticket_title: str, ticket_desc: str, employe_name: str):
    """Envoie un email au technicien quand un ticket lui est assigné"""
    subject = f"Nouveau ticket assigné : {ticket_title}"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <div style="background: #059669; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">HelpDesk IA</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd;">
            <h2>🛠️ Nouveau ticket assigné</h2>
            <p>Bonjour {tech_name},</p>
            <p>Un nouveau ticket vous a été assigné par <strong>{employe_name}</strong>.</p>
            
            <div style="background: #f9fafb; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">{ticket_title}</h3>
                <p style="margin: 0; color: #4b5563;">{ticket_desc}</p>
            </div>
            
            <p>Merci de vous connecter à votre espace technicien pour le prendre en charge.</p>
            <a href="http://localhost:5173" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Accéder à mon espace</a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </body>
    </html>
    """
    send_email(to_email, subject, body, html=True)