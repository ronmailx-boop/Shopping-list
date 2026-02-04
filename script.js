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
            // 1. ניקוי ה-Prefix של התמונה
            const base64Image = reader.result.split(',')[1];
            
            // 2. בניית הכתובת בצורה מפורשת למניעת שגיאת 404
            const apiURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + config.apiKey;

            const response = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Extract card name and all transactions as JSON: {cardName, transactions: [{name, price}]}" },
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'שגיאת API');

            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json|```/g, "").trim();
            
            const parsedData = JSON.parse(text);
            createOrUpdateListFromCard(parsedData);
            
            statusDiv.textContent = 'הושלם!';
            setTimeout(() => {
                closeModal('receiptScanModal');
                progressDiv.classList.add('hidden');
            }, 1000);
            showNotification('✅ נסרק בהצלחה');
        } catch (e) {
            alert('שגיאה בסריקה: ' + e.message);
        } finally {
            scanBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}
