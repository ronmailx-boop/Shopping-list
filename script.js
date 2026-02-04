// ========== Configuration ==========
const config = {
    apiKey: 'AIzaSyDo9mGhxEiHv0JGFKOWTfMt32hHXNuXwQM'
};

// ... (כאן יבוא כל שאר הקוד המלא של script.js ששלחת לי קודם, עם השינוי של פונקציית processReceipt)

async function processReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];
    if (!file) return alert('אנא בחר תמונה');

    const scanBtn = document.getElementById('scanBtn');
    const statusDiv = document.getElementById('scanStatus');
    const progressDiv = document.getElementById('scanProgress');

    scanBtn.disabled = true;
    progressDiv.classList.remove('hidden');
    statusDiv.textContent = 'מעבד תמונה...';

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const base64Image = reader.result.split(',')[1];
            const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + config.apiKey;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Identify the card name and extract all transactions as JSON: {cardName, transactions: [{name, price}]}" },
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'שגיאה ב-API');

            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json|```/g, "").trim();
            
            const parsedData = JSON.parse(text);
            createOrUpdateListFromCard(parsedData);
            
            statusDiv.textContent = 'הושלם!';
            setTimeout(() => closeModal('receiptScanModal'), 1000);
            showNotification('✅ נסרק בהצלחה');
        } catch (e) {
            alert('שגיאה: ' + e.message);
        } finally {
            scanBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// ... (שאר הקוד של Firebase והסנכרון ממשיך כרגיל)
