const fs = require('fs');
const path = require('path');
const natural = require('natural');
const logger = require('../utils/logger');

class HRKnowledgeBase {
    constructor() {
        this.documents = [];
        this.tfidf = new natural.TfIdf();
        this.initialized = false;
    }

    // Carica knowledge base
    async loadKnowledgeBase() {
        try {
            const knowledgeDir = path.join(__dirname, '../../data/knowledge-base');
            
            // Verifica se la directory esiste
            if (!fs.existsSync(knowledgeDir)) {
                logger.warn('Knowledge base directory not found, creating...');
                fs.mkdirSync(knowledgeDir, { recursive: true });
                await this.createSampleKnowledge(knowledgeDir);
            }
            
            const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
            
            if (files.length === 0) {
                logger.warn('No knowledge base files found, creating samples...');
                await this.createSampleKnowledge(knowledgeDir);
                return this.loadKnowledgeBase(); // Ricarica dopo aver creato i file
            }
            
            this.documents = [];
            this.tfidf = new natural.TfIdf();
            
            for (const file of files) {
                const filePath = path.join(knowledgeDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Estrai sezioni del documento
                const sections = this.extractSections(content, file);
                this.documents.push(...sections);
            }
            
            // Costruisci indice TF-IDF
            this.documents.forEach(doc => {
                this.tfidf.addDocument(doc.content.toLowerCase());
            });
            
            this.initialized = true;
            logger.info(`Knowledge base loaded: ${this.documents.length} documents from ${files.length} files`);
            
        } catch (error) {
            logger.error('Error loading knowledge base:', error);
            throw error;
        }
    }

    // Crea knowledge base di esempio
    async createSampleKnowledge(dir) {
        const leavePolicy = `# Politica Ferie e Permessi

## Tipologie di Ferie
- Vacation: 25 giorni annuali per dipendenti full-time
- Sick Leave: 10 giorni annuali per malattia  
- Personal Leave: Permessi personali non retribuiti
- Unpaid Leave: Congedo non retribuito per necessità speciali

## Processo di Richiesta
1. Sottomettere richiesta tramite sistema HRMS
2. Approvazione del manager diretto richiesta
3. Notifica automatica entro 48 ore
4. Aggiornamento bilancio ferie automatico

## Regole Approvazione
- Manager: può approvare fino a 15 giorni consecutivi
- HR: approvazione richiesta per periodi superiori
- Preavviso: minimo 7 giorni per vacation, immediato per sick leave`;

        const recruitmentPolicy = `# Politica Recruiting e Assunzioni

## Processo di Hiring
1. Definizione job description con HR
2. Pubblicazione posizione su portali
3. Screening CV automatico tramite AI
4. Colloquio telefonico (30 min)
5. Colloquio tecnico (1 ora)
6. Colloquio finale con manager (45 min)
7. Reference check
8. Offer e onboarding

## Time to Hire Target
- Junior positions: 14 giorni
- Senior positions: 21 giorni
- Executive positions: 30 giorni`;

        fs.writeFileSync(path.join(dir, 'leave-policy.md'), leavePolicy);
        fs.writeFileSync(path.join(dir, 'recruitment-policy.md'), recruitmentPolicy);
        
        logger.info('Sample knowledge base created');
    }
    
    // Estrai sezioni da markdown
    extractSections(content, filename) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = '';
        let currentTitle = filename.replace('.md', '');
        
        for (const line of lines) {
            if (line.startsWith('#')) {
                // Salva sezione precedente
                if (currentSection.trim()) {
                    sections.push({
                        title: currentTitle,
                        content: currentSection.trim(),
                        source: filename
                    });
                }
                // Inizia nuova sezione
                currentTitle = line.replace(/^#+\s*/, '');
                currentSection = '';
            } else {
                currentSection += line + '\n';
            }
        }
        
        // Salva ultima sezione
        if (currentSection.trim()) {
            sections.push({
                title: currentTitle,
                content: currentSection.trim(),
                source: filename
            });
        }
        
        return sections;
    }
    
    // Ricerca semantica con TF-IDF e keyword matching
    search(query, maxResults = 3) {
        if (!this.initialized) {
            throw new Error('Knowledge base not initialized');
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Calcola similarità TF-IDF
        this.tfidf.tfidfs(queryLower, (i, measure) => {
            if (measure > 0) {
                // Boost per keyword matching esatto
                let boost = 1;
                const content = this.documents[i].content.toLowerCase();
                
                // Boost per matching esatto di parole chiave
                const keywords = ['ferie', 'vacation', 'sick', 'hiring', 'recruitment', 'performance', 'training'];
                for (const keyword of keywords) {
                    if (queryLower.includes(keyword) && content.includes(keyword)) {
                        boost += 0.5;
                    }
                }
                
                results.push({
                    document: this.documents[i],
                    score: measure * boost,
                    relevance: measure > 0.1 ? 'high' : measure > 0.05 ? 'medium' : 'low'
                });
            }
        });
        
        // Ordina per rilevanza e prendi i migliori
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, maxResults);
    }
    
    // Genera risposta basata su contesto
    generateAnswer(query, searchResults) {
        if (!searchResults || searchResults.length === 0) {
            return {
                answer: "Mi dispiace, non ho trovato informazioni specifiche su questa domanda nella knowledge base HR. Potresti essere più specifico o contattare direttamente l'ufficio HR?",
                confidence: 'low',
                sources: []
            };
        }
        
        // Combina contesto dai risultati
        const context = searchResults.map(r => r.document.content).join('\n\n');
        const sources = searchResults.map(r => ({
            title: r.document.title,
            source: r.document.source,
            relevance: r.relevance
        }));
        
        // Pattern matching intelligente per tipi di domande
        const queryLower = query.toLowerCase();
        let answer = '';
        let confidence = 'medium';
        
        // Ferie e permessi
        if (queryLower.includes('ferie') || queryLower.includes('vacation') || queryLower.includes('permess')) {
            if (queryLower.includes('quant') || queryLower.includes('giorni')) {
                answer = "Secondo la policy aziendale, ogni dipendente full-time ha diritto a **25 giorni di vacation** e **10 giorni di sick leave** all'anno.";
                confidence = 'high';
            } else if (queryLower.includes('approv') || queryLower.includes('process') || queryLower.includes('come')) {
                answer = "Il processo per richiedere ferie prevede: 1) Sottomettere richiesta tramite sistema HRMS, 2) Approvazione del manager diretto, 3) Notifica entro 48 ore. I manager possono approvare fino a 15 giorni consecutivi, per periodi superiori è necessaria l'approvazione HR.";
                confidence = 'high';
            } else if (queryLower.includes('preavvis') || queryLower.includes('anticip')) {
                answer = "Il preavviso richiesto è: minimo **7 giorni per vacation**, **immediato per sick leave**. Per periodi di ferie prolungati si consiglia un preavviso maggiore.";
                confidence = 'high';
            }
        }
        
        // Recruitment
        if (queryLower.includes('assun') || queryLower.includes('recruitment') || queryLower.includes('hiring') || queryLower.includes('lavoro')) {
            if (queryLower.includes('process') || queryLower.includes('come') || queryLower.includes('funziona')) {
                answer = "Il processo di hiring prevede: **screening CV automatico tramite AI**, colloquio telefonico (30 min), colloquio tecnico (1 ora), colloquio finale con manager (45 min), reference check e offer.";
                confidence = 'high';
            } else if (queryLower.includes('tempo') || queryLower.includes('time') || queryLower.includes('veloce')) {
                answer = "I nostri target per time-to-hire sono: **14 giorni per junior positions**, **21 giorni per senior positions**, **30 giorni per executive positions**.";
                confidence = 'high';
            }
        }
        
        // Fallback intelligente basato su contesto
        if (!answer) {
            // Estrai informazione più rilevante dal primo risultato
            if (searchResults[0] && searchResults[0].document) {
                const bestMatch = searchResults[0].document.content;
                const sentences = bestMatch.split(/[.!?]+/).filter(s => s.trim().length > 10);
                
                // Trova la frase più rilevante
                let bestSentence = sentences[0];
                let maxRelevance = 0;
                
                for (const sentence of sentences.slice(0, 3)) {
                    const relevance = this.calculateSentenceRelevance(sentence.toLowerCase(), queryLower);
                    if (relevance > maxRelevance) {
                        maxRelevance = relevance;
                        bestSentence = sentence;
                    }
                }
                
                answer = `Basandomi sulla documentazione HR: ${bestSentence.trim()}.`;
                confidence = maxRelevance > 0.5 ? 'medium' : 'low';
            }
        }
        
        return {
            answer: answer.trim() || "Non ho trovato informazioni specifiche su questa domanda.",
            confidence,
            sources
        };
    }
    
    // Calcola rilevanza di una frase per la query
    calculateSentenceRelevance(sentence, query) {
        const queryWords = query.split(/\s+/);
        const sentenceWords = sentence.split(/\s+/);
        
        let matches = 0;
        for (const queryWord of queryWords) {
            if (queryWord.length > 2) { // Ignora parole troppo corte
                for (const sentenceWord of sentenceWords) {
                    if (sentenceWord.includes(queryWord) || queryWord.includes(sentenceWord)) {
                        matches++;
                        break;
                    }
                }
            }
        }
        
        return matches / Math.max(queryWords.length, 1);
    }
}

// Instance singleton
const knowledgeBase = new HRKnowledgeBase();

module.exports = {
    knowledgeBase
};
