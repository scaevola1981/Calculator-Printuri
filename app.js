/**
 * NEXUS 3D - Calculator Cost Printare
 * Core Logic & UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    /**
     * GHOST BUSTER: Elimină orice overlay care ar putea bloca interfața
     */
    const cleanupGhostOverlays = () => {
        const triggers = ['global-drop-overlay', 'drop-overlay', 'main-drop-card'];
        triggers.forEach(idOrClass => {
            const el = document.getElementById(idOrClass) || document.querySelector('.' + idOrClass);
            if (el) {
                console.log('Ghost Buster: Eliminat', idOrClass);
                el.remove();
            }
        });
        
        // Căutare după text dacă ID-urile nu se potrivesc
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
            if (div.textContent.includes('Trage fișierul') && div.style.zIndex > 0) {
                div.remove();
            }
        });
    };

    cleanupGhostOverlays();
    setTimeout(cleanupGhostOverlays, 1000); // Rulează și după 1 secundă pentru siguranță
    // DOM Elements - Inputs
    const materialPriceInput = document.getElementById('material-price');
    const materialWeightInput = document.getElementById('material-weight');
    const materialWeightSlider = document.getElementById('material-weight-slider');
    const printHoursInput = document.getElementById('print-hours');
    const printMinutesInput = document.getElementById('print-minutes');
    const printerPowerInput = document.getElementById('printer-power');
    const energyPriceInput = document.getElementById('energy-price');
    const laborRateInput = document.getElementById('labor-rate');
    const prepTimeInput = document.getElementById('prep-time');
    const markupInput = document.getElementById('markup');
    const failureRateInput = document.getElementById('failure-rate');
    const tvaRateInput = document.getElementById('tva-rate');
    const piecesCountInput = document.getElementById('pieces-count');

    // DOM Elements - Outputs
    const mainPriceTitle = document.getElementById('main-price-title');
    const finalPriceDisplay = document.getElementById('final-price');
    const labelPricePerPieceTitle = document.getElementById('label-price-per-piece-title');
    const labelPricePerPiece = document.getElementById('label-price-per-piece');
    const labelMaterialCost = document.getElementById('label-material-cost');
    const labelEnergyWear = document.getElementById('label-energy-wear');
    const statWeight = document.getElementById('stat-weight');
    const statTime = document.getElementById('stat-time');

    // DOM Elements - Breakdown & Chart
    const breakdownMaterial = document.getElementById('breakdown-material');
    const breakdownEnergyTotal = document.getElementById('breakdown-energy-total');
    const breakdownLabor = document.getElementById('breakdown-labor');
    const breakdownProfitTotal = document.getElementById('breakdown-profit-total');
    const breakdownSubtotal = document.getElementById('breakdown-subtotal');
    const breakdownTva = document.getElementById('breakdown-tva');
    const breakdownGrandTotal = document.getElementById('breakdown-grand-total');
    
    const chartTotal = document.getElementById('chart-total');
    const currentFileLabel = document.getElementById('stat-file');

    // Chart.js Instance
    let costChart = null;

    // Buttons
    const saveSettingsBtn = document.getElementById('save-settings');
    const exportPdfBtn = document.getElementById('export-pdf');

    /**
     * Initialize Chart
     */
    function initChart() {
        const ctx = document.getElementById('cost-chart').getContext('2d');
        costChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Material', 'Energie & Uzură', 'Manoperă', 'Profit & Rezervă'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#00d2ff', // primary
                        '#9d50bb', // secondary
                        '#6e40aa', // accent
                        '#ffffff33'  // dimmed
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw.toFixed(2)} RON`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Sync Slider and Input
    materialWeightSlider.addEventListener('input', (e) => {
        materialWeightInput.value = e.target.value;
        calculate();
    });

    materialWeightInput.addEventListener('input', (e) => {
        materialWeightSlider.value = e.target.value;
        calculate();
    });

    // Add event listeners to all inputs
    const inputs = [
        materialPriceInput, materialWeightInput, printHoursInput, printMinutesInput,
        printerPowerInput, energyPriceInput, laborRateInput,
        prepTimeInput, markupInput, failureRateInput, tvaRateInput, piecesCountInput
    ];

    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    document.getElementById('material-type').addEventListener('change', calculate);

    /**
     * Core Calculation Logic
     */
    function calculate() {
        // Get values
        const matPrice = parseFloat(materialPriceInput.value) || 0;
        const matWeight = parseFloat(materialWeightInput.value) || 0;
        const hours = parseInt(printHoursInput.value) || 0;
        const minutes = parseInt(printMinutesInput.value) || 0;
        const totalHours = hours + (minutes / 60);
        const powerWatts = parseFloat(printerPowerInput.value) || 0;
        const energyPrice = parseFloat(energyPriceInput.value) || 0;
        const laborRate = parseFloat(laborRateInput.value) || 0;
        const prepMin = parseFloat(prepTimeInput.value) || 0;
        const markupPercent = parseFloat(markupInput.value) || 0;
        const failurePercent = parseFloat(failureRateInput.value) || 0;
        const tvaPercent = parseFloat(tvaRateInput.value) || 0;
        const pieces = Math.max(1, parseInt(piecesCountInput.value) || 1);

        // 1. Material Cost
        const matCost = (matPrice / 1000) * matWeight;

        // 2. Energy Cost
        const energyCost = (powerWatts / 1000) * totalHours * energyPrice;

        // 3. Printer Wear (Estimated at 0.5 RON/hour for maintenance)
        const wearRate = 0.5; 
        const wearCost = totalHours * wearRate;
        const totalEnergyWear = energyCost + wearCost;

        // 4. Labor Cost (Prep time + 5% of print time for monitoring)
        const totalLaborHours = (prepMin / 60) + (totalHours * 0.05);
        const laborCost = totalLaborHours * laborRate;

        // 5. Production Subtotal
        const productionSubtotal = matCost + energyCost + wearCost + laborCost;

        // 6. Buffer for failures
        const failureBuffer = productionSubtotal * (failurePercent / 100);
        const subtotalWithFailure = productionSubtotal + failureBuffer;

        // 7. Profit Markup
        const profitAmount = subtotalWithFailure * (markupPercent / 100);
        
        // 8. Final Price (NET)
        const netTotal = subtotalWithFailure + profitAmount;

        // 9. TVA
        const tvaValue = netTotal * (tvaPercent / 100);
        const grossTotal = netTotal + tvaValue;

        // Update UI
        const pricePerPiece = grossTotal / pieces;
        
        if (pieces > 1) {
            mainPriceTitle.textContent = 'Preț Recomandat / Piesă';
            finalPriceDisplay.textContent = pricePerPiece.toFixed(2);
            labelPricePerPieceTitle.textContent = 'Total Plate:';
            labelPricePerPiece.textContent = `${grossTotal.toFixed(2)} RON`;
        } else {
            mainPriceTitle.textContent = 'Preț Recomandat / Print';
            finalPriceDisplay.textContent = grossTotal.toFixed(2);
            labelPricePerPieceTitle.textContent = 'Preț / Piesă:';
            labelPricePerPiece.textContent = `${pricePerPiece.toFixed(2)} RON`;
        }
        
        labelMaterialCost.textContent = `${matCost.toFixed(2)} RON`;
        labelEnergyWear.textContent = `${totalEnergyWear.toFixed(2)} RON`;
        chartTotal.textContent = grossTotal.toFixed(2);
        
        statWeight.textContent = `${matWeight.toFixed(1)}g`;
        const totalMin = Math.round((hours * 60) + minutes + prepMin);
        const displayH = Math.floor(totalMin / 60);
        const displayM = totalMin % 60;
        statTime.textContent = `${displayH}h ${displayM}m`;

        // Update Breakdown
        breakdownMaterial.textContent = `${matCost.toFixed(2)} RON`;
        breakdownEnergyTotal.textContent = `${totalEnergyWear.toFixed(2)} RON`;
        breakdownLabor.textContent = `${laborCost.toFixed(2)} RON`;
        breakdownProfitTotal.textContent = `${(failureBuffer + profitAmount).toFixed(2)} RON`;
        
        breakdownSubtotal.textContent = `${netTotal.toFixed(2)} RON`;
        breakdownTva.textContent = `${tvaValue.toFixed(2)} RON`;
        breakdownGrandTotal.textContent = `${grossTotal.toFixed(2)} RON`;

        // Update Chart
        if (costChart) {
            costChart.data.datasets[0].data = [
                matCost, 
                totalEnergyWear, 
                laborCost,
                (failureBuffer + profitAmount)
            ];
            costChart.update();
        }

        // Auto-save model session (not just global settings)
        saveSession();
    }

    function saveSession() {
        const oldSessionStr = localStorage.getItem('nexus3d_session');
        const oldSession = oldSessionStr ? JSON.parse(oldSessionStr) : {};
        
        const session = {
            weight: materialWeightInput.value,
            hours: printHoursInput.value,
            minutes: printMinutesInput.value,
            pieces: piecesCountInput.value,
            filename: currentFileLabel ? currentFileLabel.textContent : 'Niciun fișier',
            thumbnail: oldSession.thumbnail
        };
        localStorage.setItem('nexus3d_session', JSON.stringify(session));
    }

    /**
     * Persistent Settings
     */
    saveSettingsBtn.addEventListener('click', () => {
        const settings = {
            matPrice: materialPriceInput.value,
            power: printerPowerInput.value,
            energyPrice: energyPriceInput.value,
            laborRate: laborRateInput.value,
            markup: markupInput.value,
            failure: failureRateInput.value,
            tva: tvaRateInput.value
        };
        localStorage.setItem('nexus3d_settings', JSON.stringify(settings));
        
        // Visual feedback
        const originalText = saveSettingsBtn.innerHTML;
        saveSettingsBtn.innerHTML = '<i data-lucide="check"></i> Salvat!';
        lucide.createIcons();
        saveSettingsBtn.classList.add('success');
        
        setTimeout(() => {
            saveSettingsBtn.innerHTML = originalText;
            lucide.createIcons();
            saveSettingsBtn.classList.remove('success');
        }, 2000);
    });

    function loadSettings() {
        const saved = localStorage.getItem('nexus3d_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            materialPriceInput.value = settings.matPrice || materialPriceInput.value;
            printerPowerInput.value = settings.power || printerPowerInput.value;
            energyPriceInput.value = settings.energyPrice || energyPriceInput.value;
            laborRateInput.value = settings.laborRate || laborRateInput.value;
            markupInput.value = settings.markup || markupInput.value;
            failureRateInput.value = settings.failure || failureRateInput.value;
            tvaRateInput.value = settings.tva || tvaRateInput.value;
        }

        // Load Session (Model specific data) - Only load if a valid filename exists
        const savedSession = localStorage.getItem('nexus3d_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            if (session.filename && session.filename !== 'Niciun fișier') {
                materialWeightInput.value = session.weight || 0;
                materialWeightSlider.value = session.weight || 0;
                printHoursInput.value = session.hours || 0;
                printMinutesInput.value = session.minutes || 0;
                piecesCountInput.value = session.pieces || 1;
                if (currentFileLabel) {
                    currentFileLabel.textContent = session.filename;
                }
                
                const imgEl = document.getElementById('model-thumbnail');
                const iconEl = document.getElementById('file-icon');
                if (session.thumbnail && imgEl && iconEl) {
                    imgEl.src = session.thumbnail;
                    imgEl.style.display = 'block';
                    iconEl.style.display = 'none';
                } else if (imgEl && iconEl) {
                    imgEl.style.display = 'none';
                    imgEl.src = '';
                    iconEl.style.display = 'block';
                }
            } else {
                // Force 0 if no file was loaded
                materialWeightInput.value = 0;
                materialWeightSlider.value = 0;
                printHoursInput.value = 0;
                printMinutesInput.value = 0;
                piecesCountInput.value = 1;
                if (currentFileLabel) {
                    currentFileLabel.textContent = 'Niciun fișier';
                }
            }
        }
    }

    /**
     * Export / Print
     */
    exportPdfBtn.addEventListener('click', () => {
        window.print();
    });

    /**
     * Slicer Import (G-code) - Setup
     */
    const dropZoneNav = document.getElementById('drop-zone');

    function setupDropZone(dz) {
        if (!dz) return;
        
        // Eliminat toată logica de drag & drop care bloca aplicația
        
        dz.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.gcode,.3mf';
            input.onchange = (e) => handleGcodeFile(e.target.files[0]);
            input.click();
        });
    }

    // Setup Drop Zones (doar nav)
    setupDropZone(dropZoneNav);

    function handleGcodeFile(file) {
        const fileNameLower = file.name.toLowerCase();
        const is3mf = fileNameLower.endsWith('.3mf');
        if (!fileNameLower.endsWith('.gcode') && !is3mf) {
            showStatus('Te rugăm să folosești .gcode sau .3mf', 'error');
            return;
        }

        if (is3mf) {
            showStatus('Se deschide proiectul .3mf...', 'success');
            
            if (typeof JSZip === 'undefined') {
                showStatus('Eroare: Motorul de unzip lipsește!', 'error');
                return;
            }

            JSZip.loadAsync(file).then(async zip => {
                showStatus('Se caută metadate...', 'success');
                
                const files = Object.keys(zip.files);
                
                const configFile = files.find(name => name.toLowerCase().endsWith('slice_info.config'));
                const jsonFiles = files.filter(name => name.toLowerCase().includes('metadata/plate_') && name.toLowerCase().endsWith('.json'));
                const gcodeFile = files.find(name => name.toLowerCase().endsWith('.gcode'));
                let metadataFound = false;

                let totalWeight = 0;
                let totalSeconds = 0;

                // 1. Încercăm din slice_info.config (XML)
                if (configFile) {
                    try {
                        const configContent = await zip.file(configFile).async("string");
                        
                        // Căutăm greutatea pe TOATE plăcile
                        const keysToTry = ['weight', 'used_g', 'filament_weight', 'total_weight', 'mass', 'filament_used_g'];
                        keysToTry.forEach(key => {
                            const regex = new RegExp(`key=["']${key}["']\\s+value=["']([\\d.,]+)["']`, 'gi');
                            const matches = [...configContent.matchAll(regex)];
                            matches.forEach(m => {
                                const val = parseFloat(m[1].replace(',', '.'));
                                if (val > 0) totalWeight += val;
                            });
                        });

                        // Fallback atribute directe
                        if (totalWeight === 0) {
                            const attrsToTry = ['used_g', 'weight', 'filament_weight'];
                            attrsToTry.forEach(attr => {
                                const regex = new RegExp(`\\s${attr}=["']([\\d.,]+)["']`, 'gi');
                                const matches = [...configContent.matchAll(regex)];
                                matches.forEach(m => {
                                    const val = parseFloat(m[1].replace(',', '.'));
                                    if (val > 0) totalWeight += val;
                                });
                            });
                        }
                        
                        // Căutăm timpul pe TOATE plăcile
                        const timeMatches = [...configContent.matchAll(/key=["'](?:prediction|estimated_time)["']\s+value=["'](\d+)["']/gi)];
                        timeMatches.forEach(m => {
                            totalSeconds += parseInt(m[1]);
                        });
                    } catch (e) { console.error('XML Parse Error:', e); }
                }

                // 2. FALLBACK 1: Încercăm din plate_*.json
                if (totalWeight === 0 && jsonFiles.length > 0) {
                    for (const jFile of jsonFiles) {
                        try {
                            const jsonContent = await zip.file(jFile).async("string");
                            const data = JSON.parse(jsonContent);
                            
                            const arrayKeys = ['filament_used', 'filament_weight', 'filament_used_g'];
                            const singleKeys = ['weight', 'total_weight'];
                            
                            arrayKeys.forEach(k => {
                                if (data[k] && Array.isArray(data[k])) {
                                    data[k].forEach(val => { totalWeight += parseFloat(val) || 0; });
                                }
                            });
                            
                            singleKeys.forEach(k => {
                                if (data[k] && !Array.isArray(data[k])) {
                                    totalWeight += parseFloat(data[k]) || 0;
                                }
                            });

                            if (data.prediction || data.estimated_time) {
                                totalSeconds += parseInt(data.prediction || data.estimated_time) || 0;
                            }
                        } catch (e) {}
                    }
                }

                // 3. FALLBACK 2: "BRUTE FORCE" - Căutăm orice pattern de greutate în tot XML-ul
                if (totalWeight === 0 && configFile) {
                    const content = await zip.file(configFile).async("string");
                    const bruteWeightRegex = /(?:filament_used_g|filament_weight|used_g|weight|total_weight)[:= ]+["']?([\d.,]+)["']?/gi;
                    let match;
                    while ((match = bruteWeightRegex.exec(content)) !== null) {
                        totalWeight += parseFloat(match[1].replace(',', '.')) || 0;
                    }
                    
                    const bruteTimeRegex = /(?:prediction|estimated_time|total_time)[:= ]+["']?(\d+)["']?/gi;
                    while ((match = bruteTimeRegex.exec(content)) !== null) {
                        totalSeconds += parseInt(match[1]) || 0;
                    }
                }

                if (totalWeight > 0 || totalSeconds > 0) {
                    const h = Math.floor(totalSeconds / 3600);
                    const m = Math.floor((totalSeconds % 3600) / 60);
                    applyImportedData(totalWeight, h, m, file.name);
                    metadataFound = true;
                }

                // Extrage Thumbnail
                try {
                    const thumbFile = files.find(name => name.toLowerCase().includes('thumbnail') && (name.toLowerCase().endsWith('.png') || name.toLowerCase().endsWith('.webp'))) 
                                   || files.find(name => name.toLowerCase().endsWith('.png') || name.toLowerCase().endsWith('.webp'));
                    
                    const imgEl = document.getElementById('model-thumbnail');
                    const iconEl = document.getElementById('file-icon');
                    
                    if (thumbFile && imgEl && iconEl) {
                        const base64 = await zip.file(thumbFile).async("base64");
                        const ext = thumbFile.split('.').pop().toLowerCase();
                        const mime = ext === 'webp' ? 'image/webp' : 'image/png';
                        imgEl.src = `data:${mime};base64,${base64}`;
                        imgEl.style.display = 'block';
                        iconEl.style.display = 'none';
                        
                        // Save to session so it persists on reload
                        const session = JSON.parse(localStorage.getItem('nexus3d_session') || '{}');
                        session.thumbnail = `data:${mime};base64,${base64}`;
                        localStorage.setItem('nexus3d_session', JSON.stringify(session));
                    } else if (imgEl && iconEl) {
                        imgEl.style.display = 'none';
                        imgEl.src = '';
                        iconEl.style.display = 'block';
                        
                        const session = JSON.parse(localStorage.getItem('nexus3d_session') || '{}');
                        delete session.thumbnail;
                        localStorage.setItem('nexus3d_session', JSON.stringify(session));
                    }
                } catch (e) { console.error('Thumbnail extract error:', e); }

                if (!metadataFound && gcodeFile) {
                    showStatus(`Se procesează ${gcodeFile.split('/').pop()}...`, 'success');
                    const content = await zip.file(gcodeFile).async("string");
                    processGcode(content, file.name);
                } else if (!metadataFound && !gcodeFile) {
                    showStatus('Fișierul 3MF nu a fost feliat (nu conține G-code)', 'error');
                }
            }).catch(err => {
                showStatus('Fișier .3mf corupt sau neprotejat', 'error');
                console.error('JSZip Error:', err);
            });
        } else {
            showStatus('Se analizează fișierul G-code...', 'success');
            const reader = new FileReader();
            reader.onload = (e) => {
                processGcode(e.target.result, file.name);
            };
            
            // Citim începutul și sfârșitul
            const size = file.size;
            const offset = Math.max(0, size - 150000);
            const blobHead = file.slice(0, 500000);
            const blobTail = file.slice(offset, size);
            
            const r1 = new FileReader();
            r1.onload = (e1) => {
                const r2 = new FileReader();
                r2.onload = (e2) => {
                    processGcode(e1.target.result + "\n" + e2.target.result, file.name);
                };
                r2.readAsText(blobTail);
            };
            r1.readAsText(blobHead);
        }
    }

    function processGcode(content, filename) {
        const sumNum = (str) => String(str || '').split(',').reduce((sum, p) => sum + (parseFloat(p.trim().replace(',', '.')) || 0), 0);
        const num = sumNum; // Alias pentru compatibilitate

        let weight = 0;
        let lengthMm = 0;
        let volumeMm3 = 0;
        let p_hours = 0;
        let p_minutes = 0;
        let prep_time = 0;

        // densități aproximative per material pentru conversia din volum/lungime
        const densityByMaterial = {
            pla: 1.24,
            petg: 1.27,
            abs: 1.04,
            asa: 1.07,
            tpu: 1.20,
            nylon: 1.14
        };
        const selectedMaterial = (document.getElementById('material-type')?.value || 'pla').toLowerCase();
        let density = densityByMaterial[selectedMaterial] || 1.24;

        // citim densitatea/diametrul dacă există în G-code (suport ":" și "=")
        const densityMatch = content.match(/;\s*filament_density\s*[:= ]\s*(\d+[.,]?\d*)/i);
        if (densityMatch) density = num(densityMatch[1]) || density;

        const diameterMatch = content.match(/;\s*filament_diameter\s*[:= ]\s*(\d+[.,]?\d*)/i);
        let filamentDiameter = num(diameterMatch?.[1]) || 1.75; // mm

        // 1) Timpul de printare (acceptă orice mod: fast/normal/silent etc.)
        const modelTimeRegex = /;\s*(?:model printing time|estimated printing time(?:\s*\([^)]*\))?)\s*[:=]\s*(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/i;
        const totalTimeRegex = /;\s*(?:total )?estimated time\s*[:=]\s*(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/i;
        const secondsTimeRegex = /;\s*TIME[:=]\s*(\d+)/i;

        const modelMatch = content.match(modelTimeRegex);
        const totalMatch = content.match(totalTimeRegex);
        const secondsMatch = content.match(secondsTimeRegex);

        const toMinutes = (d = 0, h = 0, m = 0, s = 0) => (d * 24 * 60) + (h * 60) + m + (s / 60);

        if (modelMatch) {
            const d = num(modelMatch[1]);
            const h = num(modelMatch[2]);
            const m = num(modelMatch[3]);
            const s = num(modelMatch[4]);
            const mins = toMinutes(d, h, m, s);
            p_hours = Math.floor(mins / 60);
            p_minutes = Math.round(mins % 60);
        }

        if (totalMatch) {
            const d = num(totalMatch[1]);
            const h = num(totalMatch[2]);
            const m = num(totalMatch[3]);
            const s = num(totalMatch[4]);
            const totalMins = toMinutes(d, h, m, s);
            const modelMins = toMinutes(0, p_hours, p_minutes, 0);

            if (modelMatch && totalMins > modelMins) {
                prep_time = Math.round(totalMins - modelMins);
            } else if (!modelMatch) {
                p_hours = Math.floor(totalMins / 60);
                p_minutes = Math.round(totalMins % 60);
            }
        } else if (!modelMatch && secondsMatch) {
            const totalMins = (parseFloat(secondsMatch[1]) || 0) / 60;
            p_hours = Math.floor(totalMins / 60);
            p_minutes = Math.round(totalMins % 60);
        }

        // 2) Material (prioritate: grame -> volum -> lungime)
        // Adăugat suport pentru "=" și lista de valori (AMS)
        const weightRegex = /;\s*(?:total filament weight(?:\s*\[[^\]]+\])?\s*[:= ]\s*|filament(?: total)? used\s*\[g\]\s*[:= ]\s*|filament\s*weight\s*[:= ]\s*|filament_weight\s*[:= ]\s*|weight\s*[:= ]\s*)([\d., ]+)/i;
        const volumeRegex = /;\s*(?:total filament volume(?:\s*\[[^\]]+\])?\s*[:= ]\s*|filament used\s*\[(?:mm\^3|cm\^3|mm3|cm3)\]\s*[:= ]\s*|filament volume\s*[:= ]\s*)([\d., ]+)/i;
        const lengthRegex = /;\s*(?:total filament length(?:\s*\[[^\]]+\])?\s*[:= ]\s*|filament used\s*\[(?:mm|m)\]\s*[:= ]\s*|filament length\s*[:= ]\s*)([\d., ]+)/i;

        const weightMatch = content.match(weightRegex);
        const volumeMatch = content.match(volumeRegex);
        const lengthMatch = content.match(lengthRegex);

        const weightFromG = weightMatch ? sumNum(weightMatch[1]) : 0;
        const weightFromVol = (() => {
            if (!volumeMatch) return 0;
            let vol = sumNum(volumeMatch[1]);
            // Verificăm dacă unitatea este cm3 (Bambu folosește uneori mm3)
            const unitMatch = volumeMatch[0].match(/cm\^?3/i);
            const multiplier = unitMatch ? 1 : 0.001; // cm3 -> g vs mm3 -> g
            return vol * multiplier * density; 
        })();
        const weightFromLen = (() => {
            if (!lengthMatch) return 0;
            let lenStr = lengthMatch[1];
            // Însumăm lungimile dacă sunt mai multe
            let totalLenMm = sumNum(lenStr);
            // Dacă unitatea este m în loc de mm (Bambu folosește mm de obicei)
            if (lengthMatch[0].match(/\[m\]/i)) totalLenMm *= 1000;
            
            const area = Math.PI * Math.pow(filamentDiameter / 2, 2); // mm²
            const volMm3 = totalLenMm * area;
            return (volMm3 / 1000) * density; // mm³ -> cm³ -> g
        })();

        // Alegem cea mai mare valoare validă găsită (prioritizând scorul direct din slicer)
        weight = weightFromG || weightFromVol || weightFromLen || 0;

        // Dacă weight depășește slider-ul, mărim range-ul pentru a nu tăia valoarea
        const sliderMax = parseFloat(materialWeightSlider.max) || 2000;
        if (weight > sliderMax) {
            materialWeightSlider.max = Math.ceil(weight * 1.1);
        }

        // 3) Dacă am găsit suficiente date, populăm UI
        if (weight > 0 || p_hours > 0 || p_minutes > 0) {
            applyImportedData(weight, p_hours, p_minutes, filename, prep_time);
        } else {
            showStatus('Nu am găsit meta-date', 'error');
        }
    }

    function applyImportedData(weight, hours, minutes, filename, prep = 0) {
        materialWeightInput.value = weight.toFixed(1);
        materialWeightSlider.value = weight.toFixed(1);
        printHoursInput.value = hours;
        printMinutesInput.value = minutes;

        if (prep > 0) {
            prepTimeInput.value = prep;
        }

        // Dacă greutatea depășește slider-ul, mărim range-ul
        const sliderMax = parseFloat(materialWeightSlider.max) || 2000;
        if (weight > sliderMax) {
            materialWeightSlider.max = Math.ceil(weight * 1.1);
        }

        calculate();
        if (currentFileLabel) currentFileLabel.textContent = filename;
        showStatus(`Importat: ${filename}`, 'success');
    }

    function showStatus(msg, type) {
        const zones = [dropZoneNav];
        const color = type === 'success' ? '#00d2ff' : '#ff4b2b';
        
        zones.forEach(dz => {
            if (!dz) return;
            const span = dz.querySelector('span') || dz.querySelector('p');
            const originalText = 'Slicer Import (G-code)';
            
            if (span) span.innerHTML = msg;
            dz.style.borderColor = color;
            
            setTimeout(() => {
                if (span) span.innerHTML = originalText;
                dz.style.borderColor = dz.id === 'drop-zone' ? 'var(--border-color)' : 'var(--primary)';
            }, 3000);
        });
    }

    // Initialize
    initChart();
    loadSettings();
    calculate();
});
