// בתחתית הקובץ, במקום window.onload = render;
document.addEventListener('DOMContentLoaded', () => {
    render();
    if (localStorage.getItem('G_TOKEN')) {
        document.getElementById('cloudIndicator').style.backgroundColor = '#22c55e';
        syncWithCloud();
    }
});

// פונקציית הייבוא שביקשת
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedDb = JSON.parse(e.target.result);
            if (importedDb.lists) {
                db = importedDb;
                save();
                alert("הנתונים יובאו בהצלחה!");
                location.reload(); // מרענן כדי למנוע קיפאון
            }
        } catch(err) {
            alert("קובץ לא תקין");
        }
    };
    reader.readAsText(file);
}
