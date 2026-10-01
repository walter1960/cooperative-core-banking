import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

DOCS_DIR = '/home/walter/MonDossier/MySecrets/Corporate/COOPERATIVE/documentation'
os.makedirs(DOCS_DIR, exist_ok=True)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_base_doc():
    doc = Document()
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        footer = section.footer
        p_ft = footer.paragraphs[0]
        p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_ft = p_ft.add_run("COOPECTAT ASECNA TOGO • Système Core Banking Banolia")
        r_ft.font.size = Pt(8.5)
        r_ft.font.color.rgb = RGBColor(148, 163, 184)
    return doc

def add_header_banner(doc, title, subtitle, badge=None):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=260, bottom=260, left=260, right=260)
    
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if badge:
        r_badge = p.add_run(f"[{badge}]\n")
        r_badge.font.size = Pt(9.5)
        r_badge.font.bold = True
        r_badge.font.color.rgb = RGBColor(56, 189, 248)
    
    r_title = p.add_run(f"{title}\n")
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(255, 255, 255)
    
    r_sub = p.add_run(subtitle)
    r_sub.font.size = Pt(10.5)
    r_sub.font.color.rgb = RGBColor(203, 213, 225)
    doc.add_paragraph()

def add_callout(doc, text, title="NOTE OFFICIELLE", alert_type="info"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    cell.width = Inches(6.8)
    
    if alert_type == "warning":
        bg_color = "FEF2F2"
        border_color = "DC2626"
        title_color = RGBColor(185, 28, 28)
        text_color = RGBColor(127, 29, 29)
        prefix = "⚠️ "
    elif alert_type == "success":
        bg_color = "F0FDF4"
        border_color = "16A34A"
        title_color = RGBColor(21, 128, 61)
        text_color = RGBColor(20, 83, 45)
        prefix = "✓ "
    else:
        bg_color = "F0F9FF"
        border_color = "0284C7"
        title_color = RGBColor(3, 105, 161)
        text_color = RGBColor(12, 74, 110)
        prefix = "ℹ️ "
        
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    r_t = p.add_run(f"{prefix}{title}\n")
    r_t.font.bold = True
    r_t.font.size = Pt(10)
    r_t.font.color.rgb = title_color
    
    r_msg = p.add_run(text)
    r_msg.font.size = Pt(9.5)
    r_msg.font.color.rgb = text_color
    doc.add_paragraph()

def style_table(table, col_widths, headers, rows_data):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F172A")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    for r_idx, row_values in enumerate(rows_data):
        row = table.add_row()
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_values):
            cell = row.cells[c_idx]
            cell.text = str(val)
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=100, right=100)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(15, 23, 42)
                if any(k in str(val) for k in ["TOTAL", "Conforme", "9,00 %", "5,00 %", "10,00 %"]):
                    run.font.bold = True
    doc = table._parent
    doc.add_paragraph()

# =====================================================================
# DOCUMENT 1 : REGLES METIER ET CALCULS FINANCIERS
# =====================================================================
def build_doc_calculs():
    doc = create_base_doc()
    add_header_banner(
        doc,
        "MANUEL OFFICIEL DES RÈGLES MÉTIER ET CALCULS FINANCIERS",
        "Système Core Banking Coopératif • COOPECTAT - ASECNA TOGO\nConformité Réglementaire BCEAO / UMOA & Droit OHADA des Coopératives",
        badge="RÉFÉRENTIEL FINANCIER & ACTUARIEL"
    )

    doc.add_heading("1. Grille Officielle des Prêts (Durées, Taux et Méthodes)", level=1)
    p = doc.add_paragraph("Le système financier mutualiste applique une tarification de crédit segmentée selon la maturité du prêt avec un plafond de souscription fixé à 15 000 000 F CFA :")
    
    table = doc.add_table(rows=1, cols=5)
    headers = ["Catégorie", "Durée", "Taux Annuel", "Méthode Actuarielle", "Plafond Montant"]
    col_widths = [Inches(1.4), Inches(1.1), Inches(1.1), Inches(1.8), Inches(1.4)]
    data = [
        ["Court Terme", "0 à 12 mois", "5,00 %", "Linéaire Constant (Flat)", "15 000 000 F CFA"],
        ["Moyen Terme", "13 à 36 mois", "10,00 %", "Linéaire Constant (Flat)", "15 000 000 F CFA"],
        ["Long Terme", "37 à 60 mois", "9,00 %", "Dégressif (sur CRD)", "15 000 000 F CFA"],
    ]
    style_table(table, col_widths, headers, data)

    doc.add_heading("2. Explication Financière et Actuarielle : Linéaire vs Dégressif", level=1)
    
    doc.add_heading("A. Pourquoi et Comment les Coopératives appliquent le Taux Linéaire (0 à 36 mois) ?", level=2)
    p1 = doc.add_paragraph(
        "1. Principe et Formule Mathématique :\n"
        "L'intérêt total est calculé une seule fois sur le capital emprunté C0 pour toute la durée n (en mois) :\n"
        "   Intérêt Total = C0 × (Taux / 100) × (n / 12)\n\n"
        "Chaque mois, la mensualité prélevée sur le bulletin de paie est parfaitement identique :\n"
        "   Mensualité = (C0 / n) + [C0 × (Taux / 100) / 12]\n"
        "   Remboursement Total = C0 + Intérêt Total = n × Mensualité\n\n"
        "2. Exemple concret (Prêt Court Terme de 1 200 000 F CFA sur 12 mois à 5%) :\n"
        "   • Part mensuelle de capital amorti : 1 200 000 / 12 = 100 000 F CFA\n"
        "   • Part mensuelle d'intérêt : (1 200 000 × 0,05) / 12 = 5 000 F CFA\n"
        "   • Mensualité constante prélevée sur salaire : 100 000 + 5 000 = 105 000 F CFA\n"
        "   • Total des intérêts perçus par la coopérative : 60 000 F CFA (Total dû : 1 260 000 F CFA)\n\n"
        "3. Rationale Économique et Mutualiste :\n"
        "   • Couverture des frais fixes d'instruction : L'analyse d'un dossier, la prise de garantie et l'enregistrement comptable représentent des coûts fixes identiques pour un petit crédit. Le taux linéaire permet à la coopérative de rémunérer ses coûts de gestion sans facturer de frais de dossier cachés.\n"
        "   • Prévisibilité absolue pour la paie : La retenue mensuelle reste strictement fixe d'un bout à l'autre, simplifiant le bordereau de prélèvement de l'ASECNA."
    )

    doc.add_heading("B. Pourquoi et Comment passer au Taux Dégressif sur le Long Terme (37 à 60 mois) ?", level=2)
    p2 = doc.add_paragraph(
        "1. Principe et Formule Mathématique :\n"
        "Dans la méthode dégressive à annuités constantes, l'intérêt mensuel n'est JAMAIS calculé sur la somme de départ, mais uniquement sur le Capital Restant Dû (CRD) au début de chaque mois.\n\n"
        "Le taux mensuel périodique est : i = Taux Annuel / 12 = 0,09 / 12 = 0,0075 (soit 0,75 % par mois).\n"
        "L'annuité constante (Mensualité M) est calculée par la formule actuarielle standard :\n"
        "   M = C0 × [ i / ( 1 - (1 + i)^(-n) ) ]\n\n"
        "Chaque mois k (de 1 à n) :\n"
        "   • Intérêt du mois k : I_k = CRD_(k-1) × i\n"
        "   • Capital amorti du mois k : P_k = M - I_k\n"
        "   • Nouveau CRD à la fin du mois k : CRD_k = CRD_(k-1) - P_k\n\n"
        "2. Exemple concret (Prêt Long Terme de 6 000 000 F CFA sur 48 mois à 9% dégressif) :\n"
        "   • Mensualité constante : 6 000 000 × [ 0,0075 / (1 - 1,0075^(-48)) ] = 149 300 F CFA\n"
        "   • Au mois 1 : Intérêt = 6 000 000 × 0,75% = 45 000 F. Capital amorti = 149 300 - 45 000 = 104 300 F. Nouveau CRD = 5 895 700 F.\n"
        "   • Au mois 24 (mi-parcours) : Le CRD est tombé à 3 325 820 F. L'intérêt du mois n'est plus que de 24 944 F. Le capital amorti grimpe à 124 356 F.\n"
        "   • Au mois 48 (dernière mensualité) : L'intérêt n'est plus que de 1 111 F, et le solde tombe exactement à 0 F.\n\n"
        "3. Rationale Économique et Réglementaire Impérative :\n"
        "   • Conformité Taux d'Usure BCEAO / UMOA (Plafond TEG) : Appliquer un taux linéaire sur 4 ou 5 ans ferait exploser le Taux Effectif Global (TEG) réel au-delà de 24% (seuil légal d'usure bancaire). Le dégressif garantit un TEG légalement incontestable à 9%.\n"
        "   • Équité sociétaire : Le coopérateur ne paie des intérêts que sur ce qu'il doit encore. Plus il rembourse, moins il paie d'intérêts.\n"
        "   • Remboursement anticipé sans litige : Si le sociétaire solde son crédit au mois 20 par anticipation, il ne paie que le CRD restant. Tous les intérêts des 28 mois restants sont immédiatement annulés !"
    )

    doc.add_heading("3. Calcul et Règles du Retrait Maximum sur Épargne", level=1)
    p3 = doc.add_paragraph(
        "Le montant maximum retirable par un sociétaire dépend directement de la nature de ses engagements envers la coopérative :\n\n"
        "RÈGLE 1 : Court et Moyen Terme (ou aucun crédit long terme en cours)\n"
        "   Retrait Maximum = Solde Disponible Direct (Soit Épargne Totale - 50 000 F de maintien de compte)\n\n"
        "RÈGLE 2 : Engagement Long Terme en cours (Crédit 37 à 60 mois actif)\n"
        "   Retrait Maximum = Épargne Actuelle - Épargne Garantie (50 000 F) - Crédit Long Terme en cours (CRD)\n\n"
        "Exemple pratique :\n"
        "Un sociétaire dispose de 2 500 000 F CFA d'épargne. Il a un crédit long terme en cours dont le CRD s'élève à 1 800 000 F CFA.\n"
        "Plafond retirable autorisé = 2 500 000 - 50 000 - 1 800 000 = 650 000 F CFA."
    )

    add_callout(
        doc,
        "PRESCRIPTION OBLIGATOIRE DE RETRAIT PHYSIQUE :\n"
        "L'émission de la fiche de retrait numérique pré-bloque les fonds et édite un bordereau avec QR Code. Cependant, le sociétaire a l'obligation légale et statutaire de se déplacer physiquement en agence / au guichet pour émarger la quittance et percevoir les espèces.",
        title="OBLIGATION FORMELLE DE DÉPLACEMENT EN AGENCE",
        alert_type="warning"
    )

    doc.add_heading("4. Règle de Quotité Cessible et Capacité d'Endettement (DSTI)", level=1)
    p4 = doc.add_paragraph(
        "Conformément à la réglementation du travail et de la paie ASECNA :\n"
        "   • Quotité Cessible Légale = Salaire Net / 3 (soit un taux d'endettement maximal de 33,33 %)\n"
        "   • Ratio DSTI = (Mensualité globale de crédit / Salaire net mensuel) × 100\n\n"
        "Barème d'acceptation automatique du Core Banking :\n"
        "   • DSTI <= 33,3 % : Dossier Conforme (Acceptation directe)\n"
        "   • 33,3 % < DSTI <= 40,0 % : Risque Modéré (Caution solidaire obligatoire d'un collègue ASECNA)\n"
        "   • DSTI > 40,0 % : Rejet prudentiel automatique pour surendettement."
    )

    doc.add_heading("5. Calendrier Interactif & Calcul Automatique de la Durée", level=1)
    p5 = doc.add_paragraph(
        "Le système intègre un module de calendrier interactif pour définir la durée de remboursement :\n"
        "• Date de Début : 1er prélèvement sur bulletin de salaire (choisie sur le calendrier).\n"
        "• Date de Fin : Dernière échéance de remboursement (choisie sur le calendrier).\n"
        "• Formule de calcul automatique :\n"
        "   Durée (en mois) = (Année_Fin - Année_Début) × 12 + (Mois_Fin - Mois_Début)\n"
        "   (Ajustée automatiquement et bornée entre 1 et 60 mois statutaires).\n\n"
        "• Effet Automatique Instantané :\n"
        "   Dès la sélection des dates, le Core Banking réévalue automatiquement :\n"
        "   1. La tranche de maturité (Court Terme <= 12m, Moyen Terme 13-36m, Long Terme 37-60m).\n"
        "   2. Le taux et mode officiel : 5% Linéaire, 10% Linéaire ou 9% Dégressif sur CRD.\n"
        "   3. La mensualité constante, le coût total du crédit et le ratio d'endettement DSTI.\n"
        "   4. L'échéancier mensuel complet daté mois par mois (ex: oct. 2026, nov. 2026, etc.)."
    )

    file_path = os.path.join(DOCS_DIR, "Guide_Des_Calculs_Et_Regles_Metier.docx")
    doc.save(file_path)
    print(f"Saved: {file_path}")

# =====================================================================
# DOCUMENT 2 : STATUT DU SOCIETAIRE ET CARTE GRISE
# =====================================================================
def build_doc_societaire():
    doc = create_base_doc()
    add_header_banner(
        doc,
        "LE STATUT DU SOCIÉTAIRE ET LA CARTE EN GRIS TITANE",
        "Fondements Coopératifs • Philosophie Mutualiste • Différence avec un Client Bancaire\nCOOPECTAT - ASECNA TOGO",
        badge="PHILOSOPHIE & GOUVERNANCE COOPÉRATIVE"
    )

    doc.add_heading("1. C'est quoi un « Sociétaire » ?", level=1)
    p1 = doc.add_paragraph(
        "Dans une coopérative d'épargne et de crédit régie par l'Acte Uniforme OHADA (AUDSCOOP) et la réglementation SFD de la BCEAO, le sociétaire (ou coopérateur) n'est absolument pas un simple usager ou client passif.\n\n"
        "Le sociétaire est à la fois :\n"
        "1. Copropriétaire de l'institution : En souscrivant ses parts sociales (minimum 50 000 F CFA), il détient une fraction du capital social inaliénable de la coopérative.\n"
        "2. Décideur Démocratique : Il participe à l'Assemblée Générale annuelle où s'applique la règle d'or universelle :\n"
        "       « UNE PERSONNE = UNE VOIX »\n"
        "   Contrairement à une société anonyme ou une banque classique où celui qui a 51% des actions impose sa loi, en coopérative, l'agent technique le plus récent a exactement le même pouvoir de vote que le cadre dirigeant.\n"
        "3. Usager Privilégié et Bénéficiaire : Il est le seul habilité à solliciter des prêts, à épargner et à percevoir les ristournes issues des excédents d'exploitation."
    )

    doc.add_heading("2. Comparatif Détaillé : Sociétaire vs Client Ordinaire", level=1)
    table = doc.add_table(rows=1, cols=3)
    headers = ["Critère", "Client de Banque Commerciale", "Sociétaire de la Coopérative COOPECTAT"]
    col_widths = [Inches(1.5), Inches(2.6), Inches(2.7)]
    data = [
        ["Qualité Juridique", "Tiers contractuel (client / consommateur)", "Associé copropriétaire et membre à part entière"],
        ["Pouvoir de Vote", "Néant (les actionnaires votent selon leur capital)", "Total : 1 Homme = 1 Voix à l'Assemblée Générale"],
        ["Destination du Profit", "Dividendes versés à des actionnaires privés", "Ristournes réparties aux sociétaires et réserves communes"],
        ["Politique de Crédit", "Recherche du profit commercial maximal", "Taux mutualisé juste couvrant strictly les frais (5% à 10%)"],
        ["Régime des Frais", "Frais de tenue de compte et commissions récurrentes", "Transparence mutualiste, absence de commissions abusives"],
        ["Solidarité", "Relation bancaire froide et impersonnelle", "Solidarité professionnelle entre collègues de l'ASECNA"],
    ]
    style_table(table, col_widths, headers, data)

    doc.add_heading("3. Droits et Devoirs du Sociétaire", level=1)
    p2 = doc.add_paragraph(
        "Droits Institutionnels :\n"
        "• Droit d'élire et de se faire élire au Conseil d'Administration, Comité de Crédit et Commission de Surveillance.\n"
        "• Droit d'accès aux crédits subventionnés jusqu'à 15 000 000 F CFA remboursables par prélèvement.\n"
        "• Droit au dividende coopératif annuel voté en Assemblée Générale.\n"
        "• Droit de suivi transparent de ses opérations sur 18 mois via l'application mobile.\n\n"
        "Devoirs et Engagements :\n"
        "• Libérer la souscription minimale de 5 parts sociales (50 000 F CFA).\n"
        "• Respecter scrupuleusement les remboursements pour préserver le fonds commun des collègues.\n"
        "• Se déplacer physiquement au guichet pour émarger lors de tout décaissement d'espèces."
    )

    doc.add_heading("4. La Carte du Sociétaire (Livrée en Gris Titane & Acier)", level=1)
    p3 = doc.add_paragraph(
        "Dans l'application mobile et aux guichets, la carte sociétaire arbore désormais une robe officielle en Gris Titane & Acier Métallisé :\n\n"
        "• Teinte Symbolique : Dégradé harmonieux de nuances ardoise (#64748B, #475569, #334155, #1E293B).\n"
        "• Signification : Évoque la rigueur technique, la sécurité aéronautique et l'élégance institutionnelle du personnel ASECNA.\n"
        "• Éléments Identifiants : Nom complet du sociétaire, Matricule officiel (ex. 130049), Numéro de compte normalisé (2512 1100 1300 4901) et puce sécurisée NFC pour identification aux guichets."
    )

    file_path = os.path.join(DOCS_DIR, "Statut_Du_Societaire_Et_Carte_Grise.docx")
    doc.save(file_path)
    print(f"Saved: {file_path}")

# =====================================================================
# DOCUMENT 3 : MODULE PRELEVEMENTS ET PAIE ASECNA
# =====================================================================
def build_doc_prelevements():
    doc = create_base_doc()
    add_header_banner(
        doc,
        "MODULE OFFICIEL DES PRÉLÈVEMENTS & BORDEREAUX DE PAIE",
        "Gestion Unifiée des Prélèvements sur Salaire ASECNA TOGO • Normes SYSCOHADA SFD",
        badge="GESTION DES SALAIRES & PRÉLÈVEMENTS"
    )

    doc.add_heading("1. Règle de Terminologie Stricte : « Prélèvement »", level=1)
    p1 = doc.add_paragraph(
        "Sur l'ensemble des modules logiciels (Desktop, Mobile, API et États Comptables), la terminologie retenue de manière unique, exclusive et impérative est :\n\n"
        "                            « PRÉLÈVEMENT »\n\n"
        "Toute autre mention telle que « retenue sur salaire », « à la source », « à la base » ou « DRH » a été bannie pour consacrer le terme exact et officiel utilisé par les gestionnaires de paie et les coopérateurs."
    )

    doc.add_heading("2. Chaîne de Traitement du Prélèvement Mensuel", level=1)
    p2 = doc.add_paragraph(
        "1. Consolidation des Engagements (J-5 avant clôture de paie) :\n"
        "   Le Core Banking consolide pour chaque sociétaire identifié par son matricule (ex. 130049) :\n"
        "   • L'épargne mensuelle programmée contractuelle.\n"
        "   • L'échéance mensuelle de crédit (capital amorti + intérêt).\n"
        "   • Les cotisations tontinières éventuelles.\n\n"
        "2. Émission du Bordereau Global de Prélèvement :\n"
        "   Génération du fichier récapitulatif signé transmis à la Direction Financière pour exécution directe sur les salaires du personnel.\n\n"
        "3. Réconciliation et Lettrage Automatique :\n"
        "   Dès réception du virement global de salaire, le système décompose automatiquement la somme et crédite chaque compte sociétaire respectif (Compte 251 Dépôts d'Épargne et Compte 204 Crédits octroyés).\n\n"
        "4. Émission des Reçus Numériques et Notifications :\n"
        "   Chaque sociétaire reçoit instantanément un accusé de réception sur son smartphone attestant du « Remboursement par prélèvement » avec mise à jour immédiate de son solde."
    )

    file_path = os.path.join(DOCS_DIR, "Module_Prelevements_Et_Bordereaux_Paie.docx")
    doc.save(file_path)
    print(f"Saved: {file_path}")

# =====================================================================
# DOCUMENT 4 : FORMULAIRES OFFICIELS ET GUICHET
# =====================================================================
def build_doc_formulaires():
    doc = create_base_doc()
    add_header_banner(
        doc,
        "FORMULAIRES OFFICIELS & PROCÉDURES DE GUICHET",
        "Fiches Certifiées COOPECTAT • Demandes de Prêt avec Pièce Jointe • Fiche Retrait N° R\nObligation Formelle de Déplacement Physique en Agence",
        badge="PROCÉDURES OPÉRATIONNELLES"
    )

    add_callout(
        doc,
        "RÈGLE D'ORDRE PUBLIC ET DE CONTRÔLE INTERNE :\n"
        "La génération numérique d'une fiche de retrait avec QR Code pré-enregistre la transaction et sécurise la provision. Toutefois, le sociétaire a l'OBLIGATION ABSOLUE ET FORMELLE DE SE DÉPLACER PHYSIQUEMENT AU GUICHET DE L'AGENCE muni de sa pièce d'identité pour émarger la quittance et percevoir les espèces en main propre.",
        title="OBLIGATION FORMELLE DE DÉPLACEMENT EN AGENCE",
        alert_type="warning"
    )

    doc.add_heading("1. Fiche de Retrait Partiel N° R (Architecture en 5 Sections)", level=1)
    p1 = doc.add_paragraph(
        "Section 1 : Demande du Sociétaire (Nom, Prénoms, Matricule ASECNA, Montant en chiffres et lettres, Compte à débiter).\n"
        "Section 2 : Analyse Prudentielle par la Gérante (Vérification de l'Épargne Actuelle, Épargne Garantie de 50 000 F, Engagements Long Terme en cours, et calcul du Retrait Maximal Possible).\n"
        "Section 3 : Avis du Comité de Crédit (Visa, montant accordé et signature du Président du Comité).\n"
        "Section 4 : Autorisation de Paiement par le Trésorier Général (TG) et le Président du Conseil d'Administration (PCA).\n"
        "Section 5 : Décaissement en Caisse et Émargement Manuscrit (Contrôle d'identité, signature du caissier et signature pour décharge du sociétaire)."
    )

    doc.add_heading("2. Demande de Prêt en Ligne avec Pièce Jointe et Écrit Formel", level=1)
    p2 = doc.add_paragraph(
        "Le portail mobile et web permet au sociétaire de déposer un dossier complet :\n"
        "• Écrit formel / Motivation de la demande : Texte manuscrit ou rédigé justifiant le besoin de financement et autorisant le prélèvement sur paie.\n"
        "• Pièce jointe justificative : Possibilité de charger un fichier PDF / Image (devis d'équipement, facture proforma, lettre signée, etc.).\n"
        "• Simulateur Linéaire / Dégressif interactif avec calcul instantané de la mensualité et du ratio DSTI.\n"
        "• Suivi de la Demande sur 18 mois : Filtre temporel permettant d'examiner l'historique complet d'instruction (Statuts : Soumis, Analyse de crédit, Avis du Comité, Accordé, Rejeté)."
    )

    file_path = os.path.join(DOCS_DIR, "Formulaires_Officiels_Et_Procedures_Guichet.docx")
    doc.save(file_path)
    print(f"Saved: {file_path}")

# =====================================================================
# DOCUMENT MASTER : MANUEL COMPLET CORE BANKING COOPECTAT
# =====================================================================
def build_master_manual():
    doc = create_base_doc()
    add_header_banner(
        doc,
        "MANUEL COMPLET DU CORE BANKING COOPÉRATIF",
        "PLATEFORME BANOLIA • COOPECTAT ASECNA TOGO\nRéférentiel Exhaustif des Spécifications Techniques, Financières, Actuarielles & Métier",
        badge="DOCUMENT DE RÉFÉRENCE CONSOLIDÉ"
    )

    doc.add_heading("Sommaire Général du Manuel", level=1)
    p_sommaire = doc.add_paragraph(
        "1. Présentation Générale de l'Écosystème Banolia Core Banking\n"
        "2. Le Statut du Sociétaire (Philosophie Coopérative vs Client Bancaire)\n"
        "3. La Carte du Sociétaire en Gris Titane & Acier Métallisé\n"
        "4. Référentiel des Calculs Financiers et Actuariels (Linéaire vs Dégressif)\n"
        "5. Règles Prudentielles du Retrait Maximum sur Épargne\n"
        "6. Règle de Quotité Cessible et Ratio d'Endettement DSTI\n"
        "7. Module Officiel des Prélèvements sur Salaire ASECNA\n"
        "8. Formulaires Officiels, Fiche N° R et Obligation de Présence Physique en Agence\n"
        "9. Demandes de Prêt en Ligne (Écrit formel, Pièce jointe & Suivi 18 mois)\n"
        "10. Architecture Multi-Plateformes et Sécurité Offline-First"
    )

    doc.add_heading("1. Présentation de la Coopérative et de la Plateforme Banolia", level=1)
    doc.add_paragraph(
        "La Coopérative d'Épargne et de Crédit COOPECTAT (Agrément N° 130/MEFP/SG/CAS-IMEC) regroupe le personnel et les agents de l'ASECNA au Togo. "
        "Pour administrer ses opérations dans le respect strict des normes de la BCEAO et du SYSCOHADA SFD, elle déploie la plateforme intégrée Banolia, comprenant :\n"
        "• Banolia Server : Serveur d'orchestration, API REST sécurisée, grand livre comptable et coffre-fort transactionnel.\n"
        "• Banolia Desktop : Interface de travail complète pour la Gérante, les Caissiers, le Comité de Crédit et le Conseil d'Administration.\n"
        "• Banolia Mobile (Flutter) : Application mobile sociétaire offline-first disponible sur Android, iOS et PWA.\n"
        "• Portail Vitrine : Site officiel d'information et d'adhésion en ligne."
    )

    doc.add_heading("2. Qu'est-ce qu'un Sociétaire ? (vs Client Ordinaire)", level=1)
    doc.add_paragraph(
        "Le sociétaire est un copropriétaire de l'institution. À la différence d'un client ordinaire de banque commerciale qui est un simple consommateur extérieur enrichissant des actionnaires privés, le sociétaire détient des parts sociales, participe à l'Assemblée Générale annuelle avec le pouvoir démocratique « Une Personne = Une Voix », et perçoit des ristournes sur les excédents. La coopérative n'a pas de but spéculatif : sa mission est de servir ses membres au coût le plus juste."
    )

    doc.add_heading("3. La Carte du Sociétaire en Gris Titane", level=1)
    doc.add_paragraph(
        "La carte sociétaire est officiellement stylisée avec un dégradé de Gris Titane et Acier Métallisé (#64748B, #475569, #334155, #1E293B), incarnant la solidité, la précision et la rigueur aéronautique du personnel de l'ASECNA. Elle porte le matricule de l'agent (ex. 130049), son numéro de livret normalisé (2512 1100 1300 4901) et permet son authentification rapide par puce ou NFC aux guichets."
    )

    doc.add_heading("4. Tous les Calculs Financiers et Actuariels Expliqués", level=1)
    doc.add_paragraph(
        "Grille Officielle des Prêts (Plafond 15 000 000 F CFA) :\n"
        "• Court Terme (0 à 12 mois) : 5,00 % Linéaire Constant\n"
        "• Moyen Terme (13 à 36 mois) : 10,00 % Linéaire Constant\n"
        "• Long Terme (37 à 60 mois) : 9,00 % Dégressif sur Capital Restant Dû (CRD)\n\n"
        "Pourquoi le Linéaire sur Court/Moyen Terme ?\n"
        "L'intérêt total = C0 × (Taux / 100) × (n / 12). La mensualité = (C0 / n) + [C0 × (Taux / 100) / 12]. "
        "Elle est strictement constante, simplifiant le prélèvement sur salaire, et permet de couvrir les charges incompressibles de montage et d'analyse du dossier sans facturer de frais de dossier prohibitifs.\n\n"
        "Pourquoi le Dégressif sur Long Terme ?\n"
        "L'intérêt mensuel est calculé chaque mois sur le CRD (i = 0,09 / 12 = 0,0075). Mensualité M = C0 × [i / (1 - (1+i)^-n)]. "
        "Sur 4 ou 5 ans, un calcul linéaire ferait exploser le TEG au-delà du seuil légal d'usure bancaire fixé par la BCEAO (24%). Le dégressif garantit un TEG légalement à 9%, ne fait payer d'intérêts que sur le capital encore dû, et permet au sociétaire de solder son prêt par anticipation sans payer d'intérêts futurs !"
    )

    doc.add_heading("5. Règle du Retrait Maximum", level=1)
    doc.add_paragraph(
        "• Pour les sociétaires sans crédit long terme : Retrait Max = Solde Disponible Direct.\n"
        "• Pour les sociétaires avec crédit long terme en cours (37 à 60 mois) :\n"
        "    Retrait Max = Épargne Actuelle - Épargne Garantie (50 000 F) - Crédit Long Terme en cours (CRD).\n"
        "Cette règle prudentielle protège la coopérative en empêchant qu'un membre débiteur n'assèche sa garantie d'épargne tant que son prêt lourd n'est pas remboursé."
    )

    add_callout(
        doc,
        "OBLIGATION FORMELLE DE SE DÉPLACER EN AGENCE :\n"
        "La fiche de retrait numérique génère un bordereau officiel avec QR Code. Cependant, le sociétaire a l'obligation formelle de se déplacer physiquement en agence / au guichet pour émarger la quittance et percevoir les espèces.",
        title="OBLIGATION PHYSIQUE AU GUICHET",
        alert_type="warning"
    )

    doc.add_heading("6. Module Prélèvement & Suivi des Demandes sur 18 Mois", level=1)
    doc.add_paragraph(
        "• Terminologie : Le terme « Prélèvement » est rigoureusement appliqué partout.\n"
        "• Bordereaux : Traitement mensuel automatisé avec réconciliation comptable en 1 clic.\n"
        "• Demandes de prêt : Intègrent la zone d'écrit formel motivé, le téléversement de pièces justificatives (PDF/Image) et un filtre de suivi sur 18 mois."
    )

    file_path = os.path.join(DOCS_DIR, "Manuel_Complet_Core_Banking_COOPECTAT.docx")
    doc.save(file_path)
    print(f"Saved: {file_path}")

if __name__ == "__main__":
    print("Generating all DOCX documents...")
    build_doc_calculs()
    build_doc_societaire()
    build_doc_prelevements()
    build_doc_formulaires()
    build_master_manual()
    print("ALL 5 DOCX DOCUMENTS SUCCESSFULLY CREATED IN:", DOCS_DIR)
