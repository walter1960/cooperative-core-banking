"use strict";
/**
 * Executive Financial Ratio & Risk Analyzer
 * Implements deterministic calculation of 5 BCEAO / UMOA SFD Prudential Ratios:
 * 1. R_LIQ (Liquidity Ratio)
 * 2. PAR_30 (Portfolio at Risk 30 Days)
 * 3. PAR_90 (Portfolio at Risk 90 Days)
 * 4. OSS (Operational Self-Sufficiency)
 * 5. CAR (Capital Adequacy Ratio)
 * With 3-tier classification (COMPLIANT, WARNING, CRITICAL), zero-division safety,
 * and multilingual Natural Language Query parsing (French, Éwé, Mina).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultSnapshot = createDefaultSnapshot;
exports.calculateLiquidityRatio = calculateLiquidityRatio;
exports.calculatePAR30 = calculatePAR30;
exports.calculatePAR90 = calculatePAR90;
exports.calculateOSS = calculateOSS;
exports.calculateCAR = calculateCAR;
exports.parseFinancialQueryIntent = parseFinancialQueryIntent;
exports.processFinancialQuery = processFinancialQuery;
const multilingual_nlp_1 = require("./multilingual-nlp");
// ============================================================================
// 1. DEFAULT CONTEXT BUILDER (SYSCOA-SFD GL ACCUMULATORS)
// ============================================================================
function createDefaultSnapshot(partial) {
    return {
        agency_id: partial?.agency_id || 'A02',
        as_of_date: partial?.as_of_date || new Date().toISOString().split('T')[0],
        currency: 'XOF',
        liquid_assets: partial?.liquid_assets ?? 785000000, // 571, 311, 578, 201
        short_term_liabilities: partial?.short_term_liabilities ?? 662900000, // 251, 252, 258, 253
        gross_loan_portfolio: partial?.gross_loan_portfolio ?? 2000000000, // 201..204, 291
        loans_overdue_30_days: partial?.loans_overdue_30_days ?? 87000000, // 291100 + 291200 + 291300
        loans_overdue_90_days: partial?.loans_overdue_90_days ?? 28000000, // 291200 + 291300
        financial_operating_revenue: partial?.financial_operating_revenue ?? 240000000, // Class 7
        financial_operating_expenses: partial?.financial_operating_expenses ?? 185000000, // Class 6 (Fin + OpEx)
        loan_loss_provisions_expense: partial?.loan_loss_provisions_expense ?? 15000000, // 661000
        tier1_net_capital: partial?.tier1_net_capital ?? 350000000, // 101, 111, 112, 118, 121
        total_risk_weighted_assets: partial?.total_risk_weighted_assets ?? 1800000000, // Weighted RWA
        total_active_borrowers: partial?.total_active_borrowers ?? 1420,
        top_borrower_outstanding: partial?.top_borrower_outstanding ?? 25000000
    };
}
// ============================================================================
// 2. DETERMINISTIC RATIO COMPUTATIONS (ZERO-DIVISION SAFE)
// ============================================================================
/**
 * 1. Liquidity Ratio: R_LIQ = (Liquid Assets / Short-Term Liabilities) * 100
 * Benchmark BCEAO: >= 100%
 */
function calculateLiquidityRatio(ctx) {
    const liquid = ctx.liquid_assets || 0;
    const liabilities = ctx.short_term_liabilities || 0;
    if (liabilities <= 0) {
        return {
            metric_code: 'R_LIQ',
            metric_name: 'Ratio de Liquidité Globale',
            value_pct: 100.0,
            formatted_value: '100.00 %',
            benchmark: { regulatory_min_pct: 100.0, recommended_min_pct: 110.0 },
            status: 'COMPLIANT',
            delta_to_regulatory_min: 0.0,
            formula: 'R_{LIQ} = \\frac{\\text{Actifs Disponibles (571, 311, 578)}}{\\text{Passifs Exigibles (251, 252, 258)}} = \\text{N/A (Passifs = 0)}',
            plain_explanation: "L'institution ne présente aucun passif à court terme exigible (stade de démarrage ou caisse isolée).",
            notes: 'ZERO_LIABILITIES'
        };
    }
    const value = Math.round((liquid / liabilities) * 10000) / 100;
    const delta = Math.round((value - 100.0) * 100) / 100;
    let status = 'COMPLIANT';
    if (value < 100.0)
        status = 'CRITICAL';
    else if (value < 110.0)
        status = 'WARNING';
    return {
        metric_code: 'R_LIQ',
        metric_name: 'Ratio de Liquidité Globale',
        value_pct: value,
        formatted_value: `${value.toFixed(2)} %`,
        benchmark: { regulatory_min_pct: 100.0, recommended_min_pct: 110.0 },
        status,
        delta_to_regulatory_min: delta,
        formula: `R_{LIQ} = \\frac{${liquid.toLocaleString('fr-FR')}}{${liabilities.toLocaleString('fr-FR')}} \\times 100 = ${value.toFixed(2)}\\%`,
        plain_explanation: `La coopérative dispose de ${(liquid / liabilities).toFixed(2)} F.CFA d'actifs immédiatement liquides pour chaque 1,00 F.CFA de dépôts exigibles.`
    };
}
/**
 * 2. PAR 30: Portfolio at Risk > 30 Days = (Arrears > 30d / Gross Loans) * 100
 * Benchmark BCEAO: <= 5.0%
 */
function calculatePAR30(ctx) {
    const overdue30 = ctx.loans_overdue_30_days || 0;
    const grossPortfolio = ctx.gross_loan_portfolio || 0;
    if (grossPortfolio <= 0) {
        return {
            metric_code: 'PAR_30',
            metric_name: 'Portefeuille à Risque à 30 Jours',
            value_pct: 0.0,
            formatted_value: '0.00 %',
            benchmark: { regulatory_max_pct: 5.0, recommended_max_pct: 4.0 },
            status: 'COMPLIANT',
            delta_to_regulatory_max: -5.0,
            formula: 'PAR_{30} = \\frac{\\text{Encours Crédits > 30j (291)}}{\\text{Portefeuille Brut (20)}} = \\text{0.00% (Aucun prêt actif)}',
            plain_explanation: "L'institution n'a aucun portefeuille de crédit actif en cours.",
            notes: 'NO_ACTIVE_LOANS'
        };
    }
    const value = Math.round((overdue30 / grossPortfolio) * 10000) / 100;
    const delta = Math.round((value - 5.0) * 100) / 100;
    let status = 'COMPLIANT';
    if (value > 5.0)
        status = 'CRITICAL';
    else if (value >= 4.0)
        status = 'WARNING';
    return {
        metric_code: 'PAR_30',
        metric_name: 'Portefeuille à Risque à 30 Jours',
        value_pct: value,
        formatted_value: `${value.toFixed(2)} %`,
        benchmark: { regulatory_max_pct: 5.0, recommended_max_pct: 4.0 },
        status,
        delta_to_regulatory_max: delta,
        formula: `PAR_{30} = \\frac{${overdue30.toLocaleString('fr-FR')}}{${grossPortfolio.toLocaleString('fr-FR')}} \\times 100 = ${value.toFixed(2)}\\%`,
        plain_explanation: `Le taux d'impayés à plus de 30 jours est de ${value.toFixed(2)}% (plafond réglementaire BCEAO : 5,00%).`
    };
}
/**
 * 3. PAR 90: Portfolio at Risk > 90 Days = (Arrears > 90d / Gross Loans) * 100
 * Benchmark BCEAO: <= 2.0% - 3.0%
 */
function calculatePAR90(ctx) {
    const overdue90 = ctx.loans_overdue_90_days || 0;
    const grossPortfolio = ctx.gross_loan_portfolio || 0;
    if (grossPortfolio <= 0) {
        return {
            metric_code: 'PAR_90',
            metric_name: 'Portefeuille à Risque à 90 Jours (Créances Douteuses)',
            value_pct: 0.0,
            formatted_value: '0.00 %',
            benchmark: { regulatory_max_pct: 3.0, recommended_max_pct: 1.5 },
            status: 'COMPLIANT',
            delta_to_regulatory_max: -3.0,
            formula: 'PAR_{90} = \\frac{\\text{Encours Crédits > 90j (2912/2913)}}{\\text{Portefeuille Brut (20)}} = \\text{0.00% (Aucun prêt actif)}',
            plain_explanation: "L'institution n'a aucune créance douteuse ou compromise.",
            notes: 'NO_ACTIVE_LOANS'
        };
    }
    const value = Math.round((overdue90 / grossPortfolio) * 10000) / 100;
    const delta = Math.round((value - 3.0) * 100) / 100;
    let status = 'COMPLIANT';
    if (value > 2.0)
        status = 'CRITICAL';
    else if (value >= 1.5)
        status = 'WARNING';
    return {
        metric_code: 'PAR_90',
        metric_name: 'Portefeuille à Risque à 90 Jours (Créances Douteuses)',
        value_pct: value,
        formatted_value: `${value.toFixed(2)} %`,
        benchmark: { regulatory_max_pct: 3.0, recommended_max_pct: 1.5 },
        status,
        delta_to_regulatory_max: delta,
        formula: `PAR_{90} = \\frac{${overdue90.toLocaleString('fr-FR')}}{${grossPortfolio.toLocaleString('fr-FR')}} \\times 100 = ${value.toFixed(2)}\\%`,
        plain_explanation: `Le niveau des créances en souffrance à plus de 90 jours représente ${value.toFixed(2)}% du portefeuille brut.`
    };
}
/**
 * 4. OSS: Operational Self-Sufficiency = (Revenue / (Expenses + Provisions)) * 100
 * Benchmark: > 110%
 */
function calculateOSS(ctx) {
    const revenue = ctx.financial_operating_revenue || 0;
    const expenses = (ctx.financial_operating_expenses || 0) + (ctx.loan_loss_provisions_expense || 0);
    if (expenses <= 0) {
        return {
            metric_code: 'OSS',
            metric_name: 'Autosuffisance Opérationnelle (OSS)',
            value_pct: 100.0,
            formatted_value: '100.00 %',
            benchmark: { regulatory_min_pct: 100.0, recommended_min_pct: 110.0 },
            status: 'COMPLIANT',
            delta_to_regulatory_min: 0.0,
            formula: 'OSS = \\frac{\\text{Produits d\'Exploitation (Cl. 7)}}{\\text{Charges Totales (Cl. 6)}} = \\text{100.00% (Charges = 0)}',
            plain_explanation: "L'institution ne supporte actuellement aucune charge d'exploitation enregistrée.",
            notes: 'ZERO_EXPENSES'
        };
    }
    const value = Math.round((revenue / expenses) * 10000) / 100;
    const delta = Math.round((value - 100.0) * 100) / 100;
    let status = 'COMPLIANT';
    if (value < 100.0)
        status = 'CRITICAL';
    else if (value < 110.0)
        status = 'WARNING';
    return {
        metric_code: 'OSS',
        metric_name: 'Autosuffisance Opérationnelle (OSS)',
        value_pct: value,
        formatted_value: `${value.toFixed(2)} %`,
        benchmark: { regulatory_min_pct: 100.0, recommended_min_pct: 110.0 },
        status,
        delta_to_regulatory_min: delta,
        formula: `OSS = \\frac{${revenue.toLocaleString('fr-FR')}}{${expenses.toLocaleString('fr-FR')}} \\times 100 = ${value.toFixed(2)}\\%`,
        plain_explanation: `Les produits financiers et d'exploitation couvrent ${value.toFixed(2)}% des charges financières, opérationnelles et dotations aux provisions.`
    };
}
/**
 * 5. CAR: Capital Adequacy Ratio = (Net Capital / Risk-Weighted Assets) * 100
 * Benchmark BCEAO: >= 10.0% to >= 15.0%
 */
function calculateCAR(ctx) {
    const netCapital = ctx.tier1_net_capital || 0;
    const rwa = ctx.total_risk_weighted_assets || 0;
    if (netCapital <= 0) {
        return {
            metric_code: 'CAR',
            metric_name: 'Ratio de Solvabilité & Fonds Propres (CAR)',
            value_pct: 0.0,
            formatted_value: '0.00 %',
            benchmark: { regulatory_min_pct: 10.0, recommended_min_pct: 15.0 },
            status: 'CRITICAL',
            delta_to_regulatory_min: -10.0,
            formula: `CAR = \\frac{${netCapital.toLocaleString('fr-FR')}}{${rwa.toLocaleString('fr-FR')}} \\times 100 \\le 0\\%`,
            plain_explanation: 'Fonds propres prudentiels nets négatifs ou nuls. Sous-capitalisation critique.',
            notes: 'NEGATIVE_OR_ZERO_EQUITY'
        };
    }
    if (rwa <= 0) {
        return {
            metric_code: 'CAR',
            metric_name: 'Ratio de Solvabilité & Fonds Propres (CAR)',
            value_pct: 100.0,
            formatted_value: '100.00 %',
            benchmark: { regulatory_min_pct: 10.0, recommended_min_pct: 15.0 },
            status: 'COMPLIANT',
            delta_to_regulatory_min: 90.0,
            formula: 'CAR = \\frac{\\text{Fonds Propres (101..121)}}{\\text{RWA}} = \\text{100.00% (Actifs pondérés = 0)}',
            plain_explanation: "L'institution ne porte aucun actif pondéré par le risque.",
            notes: 'ZERO_RWA'
        };
    }
    const value = Math.round((netCapital / rwa) * 10000) / 100;
    const delta = Math.round((value - 10.0) * 100) / 100;
    let status = 'COMPLIANT';
    if (value < 10.0)
        status = 'CRITICAL';
    else if (value < 15.0)
        status = 'WARNING';
    return {
        metric_code: 'CAR',
        metric_name: 'Ratio de Solvabilité & Fonds Propres (CAR)',
        value_pct: value,
        formatted_value: `${value.toFixed(2)} %`,
        benchmark: { regulatory_min_pct: 10.0, recommended_min_pct: 15.0 },
        status,
        delta_to_regulatory_min: delta,
        formula: `CAR = \\frac{${netCapital.toLocaleString('fr-FR')}}{${rwa.toLocaleString('fr-FR')}} \\times 100 = ${value.toFixed(2)}\\%`,
        plain_explanation: `Les fonds propres prudentiels nets représentent ${value.toFixed(2)}% du total des actifs pondérés par le risque (norme BCEAO : >= 10,00%).`
    };
}
// ============================================================================
// 3. NATURAL LANGUAGE QUERY PARSER & INTENT CLASSIFICATION
// ============================================================================
function parseFinancialQueryIntent(query) {
    const norm = (0, multilingual_nlp_1.normalizeGbeText)(query);
    let detected_language = 'fr-FR';
    if (norm.includes('asie') || norm.includes('kpo') || norm.includes('akonta') || norm.includes('gome') || norm.includes('xexleme')) {
        detected_language = 'ee-TG';
    }
    else if (norm.includes('tentin') || norm.includes('akonti') || norm.includes('gblẽ') || norm.includes('gble')) {
        detected_language = 'gej-TG';
    }
    const requested = [];
    // Liquidity
    if (norm.includes('liquidit') || norm.includes('disponible') || norm.includes('caisse') ||
        norm.includes('ga si le asie') || norm.includes('ga le caisse') || norm.includes('liquidite le tentin')) {
        requested.push('R_LIQ');
    }
    // PAR 30
    if (norm.includes('par 30') || norm.includes('par30') || norm.includes('30 jour') || norm.includes('30j') ||
        norm.includes('un mois') || norm.includes('retard 30') || norm.includes('nkeke blaeto') || norm.includes('nkeke 30')) {
        requested.push('PAR_30');
    }
    // PAR 90
    if (norm.includes('par 90') || norm.includes('par90') || norm.includes('90 jour') || norm.includes('90j') ||
        norm.includes('douteuse') || norm.includes('compromis') || norm.includes('trois mois') ||
        norm.includes('nkeke 90') || norm.includes('efe gblegble') || norm.includes('ga gblegble')) {
        requested.push('PAR_90');
    }
    // OSS
    if (norm.includes('oss') || norm.includes('autosuffisance') || norm.includes('rentab') ||
        norm.includes('couverture des charges') || norm.includes('vide kpom') || norm.includes('kua de gome')) {
        requested.push('OSS');
    }
    // CAR / Solvency
    if (norm.includes('car') || norm.includes('solvabilit') || norm.includes('adequation') ||
        norm.includes('adéquation') || norm.includes('fonds propres') || norm.includes('capital') ||
        norm.includes('fonds propres le kpe') || norm.includes('hennu ga')) {
        requested.push('CAR');
    }
    // If general summary or multiple requested
    if (requested.length === 0 ||
        norm.includes('synthese') || norm.includes('synthèse') || norm.includes('point sur les risques') ||
        norm.includes('tableau de bord') || norm.includes('bilan') || norm.includes('audit') ||
        norm.includes('situation') || norm.includes('blibo')) {
        return {
            intent: requested.length > 0 ? 'MULTI_METRIC_QUERY' : 'GENERAL_RISK_SUMMARY',
            requested_metrics: requested.length > 0 ? requested : ['R_LIQ', 'PAR_30', 'PAR_90', 'OSS', 'CAR'],
            detected_language
        };
    }
    return {
        intent: requested.length === 1 ? `METRIC_QUERY_${requested[0]}` : 'MULTI_METRIC_QUERY',
        requested_metrics: requested,
        detected_language
    };
}
// ============================================================================
// 4. FINANCIAL EXECUTIVE ANALYZER ENGINE
// ============================================================================
function processFinancialQuery(request) {
    const startTime = Date.now();
    const ctx = createDefaultSnapshot(request.portfolio_context);
    const parsed = parseFinancialQueryIntent(request.query || '');
    // Calculate all 5 core ratios
    const rLiq = calculateLiquidityRatio(ctx);
    const par30 = calculatePAR30(ctx);
    const par90 = calculatePAR90(ctx);
    const oss = calculateOSS(ctx);
    const car = calculateCAR(ctx);
    const allMetrics = {
        R_LIQ: rLiq,
        PAR_30: par30,
        PAR_90: par90,
        OSS: oss,
        CAR: car,
        GENERAL_SUMMARY: rLiq // fallback reference
    };
    // Determine overall status based on highest severity
    let overallStatus = 'COMPLIANT';
    const checkMetrics = [rLiq, par30, par90, oss, car];
    if (checkMetrics.some(m => m.status === 'CRITICAL')) {
        overallStatus = 'CRITICAL';
    }
    else if (checkMetrics.some(m => m.status === 'WARNING')) {
        overallStatus = 'WARNING';
    }
    // Filter requested metrics
    const requestedMap = {};
    for (const mCode of parsed.requested_metrics) {
        if (allMetrics[mCode]) {
            requestedMap[mCode] = allMetrics[mCode];
        }
    }
    // Primary single metric if single query
    const primaryMetric = parsed.requested_metrics.length === 1 ? allMetrics[parsed.requested_metrics[0]] : null;
    // Build Executive Summary & Action items
    const vulnerabilities = [];
    const recommendedActions = [];
    if (rLiq.status === 'CRITICAL') {
        vulnerabilities.push(`Tension critique de trésorerie : le ratio de liquidité (${rLiq.formatted_value}) est sous le seuil légal BCEAO de 100,00%.`);
        recommendedActions.push("Suspendre immédiatement les nouveaux décaissements de crédits et mobiliser les lignes de refinancement bancaires.");
    }
    else if (rLiq.status === 'WARNING') {
        vulnerabilities.push(`Vigilance trésorerie : le ratio de liquidité (${rLiq.formatted_value}) est proche du plancher réglementaire de 100,00%.`);
        recommendedActions.push("Surveiller le rythme des retraits et accélérer les recouvrements des crédits à court terme.");
    }
    if (par30.status === 'CRITICAL') {
        vulnerabilities.push(`Dégradation sévère du portefeuille : le PAR 30 (${par30.formatted_value}) dépasse le plafond réglementaire de 5,00%.`);
        recommendedActions.push("Déployer une commission de recouvrement spéciale terrain et provisionner les créances douteuses au compte 661000.");
    }
    else if (par30.status === 'WARNING') {
        vulnerabilities.push(`Alerte impayés : le PAR 30 (${par30.formatted_value}) franchit le seuil d'alerte interne de 4,00%.`);
        recommendedActions.push("Intensifier les relances téléphoniques et les visites terrain sur les échéances de 31 à 60 jours.");
    }
    if (oss.status === 'CRITICAL') {
        vulnerabilities.push(`Déficit d'exploitation : l'autosuffisance opérationnelle (${oss.formatted_value}) est inférieure à 100,00%.`);
        recommendedActions.push("Restructurer les charges opérationnelles et ajuster la tarification des commissions de services.");
    }
    if (car.status === 'CRITICAL') {
        vulnerabilities.push(`Sous-capitalisation : le ratio de solvabilité (${car.formatted_value}) est sous le minimum prudentiel BCEAO de 10,00%.`);
        recommendedActions.push("Convoquer une Assemblée Générale pour une augmentation de capital par souscription de parts sociales.");
    }
    if (vulnerabilities.length === 0) {
        vulnerabilities.push("Aucune non-conformité majeure détectée : tous les ratios prudentiels BCEAO respectent les seuils de sécurité.");
        recommendedActions.push("Maintenir la politique prudente de distribution de crédit et continuer le suivi hebdomadaire du PAR.");
    }
    const executiveSummary = primaryMetric
        ? `${primaryMetric.metric_name} : ${primaryMetric.formatted_value} (Statut : ${primaryMetric.status}). ${primaryMetric.plain_explanation}`
        : `Synthèse Financière : Liquidité à ${rLiq.formatted_value} (${rLiq.status}), PAR 30 à ${par30.formatted_value} (${par30.status}), PAR 90 à ${par90.formatted_value} (${par90.status}), OSS à ${oss.formatted_value} (${oss.status}), Solvabilité CAR à ${car.formatted_value} (${car.status}). Santé globale : ${overallStatus}.`;
    const durationMs = Date.now() - startTime;
    return {
        success: true,
        latency_ms: durationMs,
        query_metadata: {
            detected_intent: parsed.intent,
            detected_language: parsed.detected_language,
            requested_metrics: parsed.requested_metrics
        },
        overall_health_status: overallStatus,
        metric_type: primaryMetric ? primaryMetric.metric_code : 'GENERAL_SUMMARY',
        value: primaryMetric ? primaryMetric.value_pct : null,
        formatted_value: primaryMetric ? primaryMetric.formatted_value : `${rLiq.formatted_value} (R_LIQ) / ${par30.formatted_value} (PAR30)`,
        explanation: primaryMetric ? primaryMetric.plain_explanation : executiveSummary,
        formula: primaryMetric ? primaryMetric.formula : 'R_{LIQ} + PAR_{30} + PAR_{90} + OSS + CAR',
        status: primaryMetric ? primaryMetric.status : overallStatus,
        benchmarks: primaryMetric ? primaryMetric.benchmark : { regulatory_min_pct: 100.0 },
        metrics: requestedMap,
        executive_summary: executiveSummary,
        vulnerabilities,
        recommended_actions: recommendedActions
    };
}
