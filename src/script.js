// --- Prayer Times Logic ---
const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const ALADHAN_API = 'https://api.aladhan.com/v1/timings';

async function fetchPrayerTimes(lat, lng) {
    try {
        const response = await fetch(`${ALADHAN_API}?latitude=${lat}&longitude=${lng}&method=2`);
        const data = await response.json();
        return data.data.timings;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
    }
}

function updateDateDisplay() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

function updatePrayerUI(timings) {
    const list = document.getElementById('prayer-times-list');
    list.innerHTML = '';

    const now = new Date();
    let nextPrayer = null;
    let minDiff = Infinity;

    PRAYER_NAMES.forEach(name => {
        const timeStr = timings[name];
        const formatted = formatTime(timeStr);
        
        // Calculate next prayer
        const [h, m] = timeStr.split(':');
        const pDate = new Date();
        pDate.setHours(h, m, 0);
        
        const diff = pDate - now;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = { name, time: formatted, diff };
        }

        const row = document.createElement('div');
        row.className = `flex justify-between items-center p-5 rounded-2xl border-b border-[#E5E5E5] hover:bg-white transition-colors ${nextPrayer?.name === name ? 'bg-white shadow-sm' : ''}`;
        row.innerHTML = `
            <span class="font-medium ${nextPrayer?.name === name ? 'text-[#5A5A40]' : 'text-[#8E9299]'} uppercase tracking-wider text-xs">${name}</span>
            <span class="font-light text-lg">${formatted}</span>
        `;
        list.appendChild(row);
    });

    if (nextPrayer) {
        document.getElementById('next-prayer-name').textContent = nextPrayer.name;
        document.getElementById('next-prayer-time').textContent = nextPrayer.time.split(' ')[0];
        
        const hours = Math.floor(nextPrayer.diff / (1000 * 60 * 60));
        const mins = Math.floor((nextPrayer.diff % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('time-remaining').textContent = `Remaining: ${hours}h ${mins}m`;
    }
}

// --- Geolocation ---
function init() {
    updateDateDisplay();

    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Reverse geocode for city name (simple version)
                const locDisplay = document.getElementById('location-display').querySelector('span');
                locDisplay.textContent = "Detecting City...";
                
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const geoData = await geoRes.json();
                    locDisplay.textContent = geoData.address.city || geoData.address.town || "Your Location";
                } catch {
                    locDisplay.textContent = "Your Location";
                }

                const timings = await fetchPrayerTimes(latitude, longitude);
                if (timings) updatePrayerUI(timings);
            },
            (error) => {
                console.error('Geolocation error:', error);
                document.getElementById('location-display').querySelector('span').textContent = "Location Access Denied";
            }
        );
    }
}

document.addEventListener('DOMContentLoaded', init);
