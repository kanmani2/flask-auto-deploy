// ==================== GLOBAL VARIABLES ====================
let formData = {};
let photoDataURL = '';
let signatureDataURL = '';
let logo1DataURL = '';
let logo2DataURL = '';
let logo1Format = 'PNG'; // Store original format
let logo2Format = 'PNG'; // Store original format

// ==================== LOAD LOGOS ON PAGE LOAD ====================
window.addEventListener('DOMContentLoaded', () => {
    loadLogosAsBase64();
});

// ==================== LOAD LOGO IMAGES AS BASE64 ====================
function loadLogosAsBase64() {
    // Load Logo 1 (Left - BTPL Logo)
    const logo1Img = document.getElementById('logo1Image');
    if (logo1Img && logo1Img.complete) {
        convertImageToBase64(logo1Img, 1);
    } else if (logo1Img) {
        logo1Img.addEventListener('load', () => convertImageToBase64(logo1Img, 1));
        logo1Img.addEventListener('error', () => {
            console.warn('Logo 1 not found, creating placeholder');
            createPlaceholderLogo(1);
        });
    } else {
        createPlaceholderLogo(1);
    }

    // Load Logo 2 (Right - YSC Logo)
    const logo2Img = document.getElementById('logo2Image');
    if (logo2Img && logo2Img.complete) {
        convertImageToBase64(logo2Img, 2);
    } else if (logo2Img) {
        logo2Img.addEventListener('load', () => convertImageToBase64(logo2Img, 2));
        logo2Img.addEventListener('error', () => {
            console.warn('Logo 2 not found, creating placeholder');
            createPlaceholderLogo(2);
        });
    } else {
        createPlaceholderLogo(2);
    }
}

// Convert image element to Base64 (preserving original format)
function convertImageToBase64(imgElement, logoNumber) {
    try {
        // Create canvas with exact image dimensions
        const canvas = document.createElement('canvas');
        const naturalWidth = imgElement.naturalWidth || imgElement.width;
        const naturalHeight = imgElement.naturalHeight || imgElement.height;
        
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;
        
        const ctx = canvas.getContext('2d');
        
        // Draw image without any modifications
        ctx.drawImage(imgElement, 0, 0, naturalWidth, naturalHeight);
        
        // Detect the original image format
        const imageSrc = imgElement.src.toLowerCase();
        let imageFormat = 'image/png'; // default
        let formatType = 'PNG';
        
        if (imageSrc.includes('.jpg') || imageSrc.includes('.jpeg')) {
            imageFormat = 'image/jpeg';
            formatType = 'JPEG';
        } else if (imageSrc.includes('.png')) {
            imageFormat = 'image/png';
            formatType = 'PNG';
        } else if (imageSrc.includes('.webp')) {
            imageFormat = 'image/webp';
            formatType = 'WEBP';
        }
        
        // Convert to Base64 with original format and maximum quality (1.0 = 100%)
        const dataURL = canvas.toDataURL(imageFormat, 1.0);
        
        if (logoNumber === 1) {
            logo1DataURL = dataURL;
            logo1Format = formatType;
            console.log(`✅ Logo 1 loaded successfully (Format: ${formatType}, Size: ${naturalWidth}x${naturalHeight})`);
        } else {
            logo2DataURL = dataURL;
            logo2Format = formatType;
            console.log(`✅ Logo 2 loaded successfully (Format: ${formatType}, Size: ${naturalWidth}x${naturalHeight})`);
        }
    } catch (error) {
        console.error(`Error converting logo ${logoNumber}:`, error);
        createPlaceholderLogo(logoNumber);
    }
}

// Create placeholder logo if image not found
function createPlaceholderLogo(logoNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    // Draw circle background
    ctx.fillStyle = logoNumber === 1 ? '#1e40af' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(75, 75, 70, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(logoNumber === 1 ? 'BTPL' : 'YSC', 75, 75);
    
    const dataURL = canvas.toDataURL('image/png');
    if (logoNumber === 1) {
        logo1DataURL = dataURL;
    } else {
        logo2DataURL = dataURL;
    }
    console.log(`✅ Placeholder logo ${logoNumber} created`);
}

// ==================== PHOTO UPLOAD FUNCTIONALITY ====================
const photoBox = document.getElementById('photoBox');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoPlaceholder = document.querySelector('.photo-placeholder');

if (photoBox && photoInput) {
    photoBox.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('❌ File size must be less than 5MB!');
                return;
            }
            
            // Validate file type
            if (!file.type.match('image.*')) {
                alert('❌ Please upload an image file!');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                photoDataURL = e.target.result;
                photoPreview.src = photoDataURL;
                photoPreview.style.display = 'block';
                if (photoPlaceholder) photoPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
}

// ==================== SIGNATURE CANVAS FUNCTIONALITY ====================
const signatureCanvas = document.getElementById('signatureCanvas');
const clearSignatureBtn = document.getElementById('clearSignature');
let isDrawing = false;
let ctx = null;
let lastX = 0;
let lastY = 0;

if (signatureCanvas) {
    // Set canvas size properly
    function resizeCanvas() {
        const container = signatureCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Store the current canvas content
        const imageData = ctx ? ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height) : null;
        
        // Set canvas resolution (actual pixels)
        signatureCanvas.width = rect.width - 20;
        signatureCanvas.height = 150;
        
        // Restore context
        ctx = signatureCanvas.getContext('2d');
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Restore the image if it existed
        if (imageData) {
            ctx.putImageData(imageData, 0, 0);
        }
    }

    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get coordinates relative to canvas
    function getCoordinates(e) {
        const rect = signatureCanvas.getBoundingClientRect();
        const scaleX = signatureCanvas.width / rect.width;
        const scaleY = signatureCanvas.height / rect.height;
        
        if (e.touches && e.touches.length > 0) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }
    }

    // Start drawing
    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        const coords = getCoordinates(e);
        lastX = coords.x;
        lastY = coords.y;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    // Draw
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const coords = getCoordinates(e);
        
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        lastX = coords.x;
        lastY = coords.y;
    }

    // Stop drawing
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            ctx.closePath();
        }
    }

    // Mouse events
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    signatureCanvas.addEventListener('touchstart', startDrawing);
    signatureCanvas.addEventListener('touchmove', draw);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    signatureCanvas.addEventListener('touchcancel', stopDrawing);
}

// Clear signature
if (clearSignatureBtn && signatureCanvas) {
    clearSignatureBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (ctx) {
            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            console.log('✅ Signature cleared');
        }
    });
}

// ==================== FORM SUBMISSION ====================
const registrationForm = document.getElementById('registrationForm');

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate photo upload
        if (!photoDataURL) {
            alert('❌ Please upload your passport size photo!');
            return;
        }

        // Validate signature
        if (!ctx || !isCanvasBlank(signatureCanvas)) {
            // Canvas has content
        } else {
            alert('❌ Please provide your signature!');
            return;
        }

        // Collect form data
        formData = {
            registrationID: generateRegistrationID(),
            registrationDate: new Date().toLocaleDateString('en-IN'),
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value,
            handed: document.querySelector('input[name="handed"]:checked').value,
            specialist: document.querySelector('input[name="specialist"]:checked').value,
            achievement: document.getElementById('achievement').value,
            jerseySize: document.querySelector('input[name="jerseySize"]:checked').value
        };

        // Save signature
        signatureDataURL = signatureCanvas.toDataURL();

        // Show success modal
        const modal = document.getElementById('successModal');
        const regIdSpan = document.getElementById('regId');
        if (modal && regIdSpan) {
            regIdSpan.textContent = formData.registrationID;
            modal.style.display = 'flex';
        }

        console.log('✅ Form submitted successfully');
        console.log('📋 Form Data:', formData);
    });
}

// Generate unique registration ID
function generateRegistrationID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BTPL2026-${timestamp}-${random}`;
}

// Check if canvas is blank
function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
}

// ==================== PDF GENERATION ====================
async function generatePDF() {
    try {
        console.log('📄 Generating PDF...');

        if (!formData.registrationID) {
            alert('❌ No registration data found!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let yPosition = 15;

        // ========== HEADER WITH TWO LOGOS ==========
        // Background for header
        pdf.setFillColor(240, 248, 255);
        pdf.rect(0, 0, pageWidth, 65, 'F');

        // Add Logo 1 (left side - BTPL) - Using original format
        if (logo1DataURL) {
            try {
                // Use original format and proportional sizing
                pdf.addImage(logo1DataURL, logo1Format, margin, yPosition - 5, 35, 35);
            } catch (err) {
                console.warn('Could not add logo 1:', err);
            }
        }

        // Add Logo 2 (right side - YSC) - Using original format
        if (logo2DataURL) {
            try {
                // Use original format and proportional sizing
                pdf.addImage(logo2DataURL, logo2Format, pageWidth - margin - 22, yPosition + 2, 20, 20);
            } catch (err) {
                console.warn('Could not add logo 2:', err);
            }
        }

        // Title Text (center) - Updated to match HTML header
        pdf.setTextColor(30, 64, 175);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('BANGALORE DISTRICT THROWBALL ASSOCIATION', pageWidth / 2, yPosition + 2, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.text('&', pageWidth / 2, yPosition + 8, { align: 'center' });
        
        pdf.setFontSize(11);
        pdf.text('YOUNGSTERS SPORTS CLUB', pageWidth / 2, yPosition + 13, { align: 'center' });
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Presents', pageWidth / 2, yPosition + 18, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175);
        pdf.text('BANGALORE THROWBALL PREMIER LEAGUE', pageWidth / 2, yPosition + 25, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setTextColor(220, 38, 38);
        pdf.text('SEASON - 1', pageWidth / 2, yPosition + 31, { align: 'center' });
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175);
        pdf.text('REGISTRATION FORM', pageWidth / 2, yPosition + 38, { align: 'center' });

        // Decorative line below header
        pdf.setDrawColor(30, 64, 175);
        pdf.setLineWidth(0.8);
        pdf.line(margin, 60, pageWidth - margin, 60);

        yPosition = 70;

        // ========== REGISTRATION ID BOX ==========
        pdf.setFillColor(240, 248, 255);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, 'F');
        pdf.setDrawColor(30, 64, 175);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2);
        
        pdf.setTextColor(30, 64, 175);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Registration ID:', margin + 5, yPosition + 7);
        
        pdf.setTextColor(220, 38, 38);
        pdf.setFontSize(11);
        pdf.text(formData.registrationID, margin + 45, yPosition + 7);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Date: ${formData.registrationDate}`, pageWidth - margin - 5, yPosition + 7, { align: 'right' });

        yPosition += 20;

        // ========== PHOTO ==========
        if (photoDataURL) {
            pdf.addImage(photoDataURL, 'JPEG', pageWidth - margin - 28, yPosition, 25, 30);
        }

        // ========== PERSONAL INFORMATION ==========
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175);
        pdf.text('PERSONAL INFORMATION', margin, yPosition);
        yPosition += 7;

        pdf.setDrawColor(30, 64, 175);
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPosition, pageWidth - margin - 30, yPosition);
        yPosition += 5;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        const personalInfo = [
            { label: 'Name', value: `${formData.firstName} ${formData.lastName}` },
            { label: 'Phone', value: formData.phone },
            { label: 'Email', value: formData.email },
            { label: 'Address', value: formData.address },
            { label: 'City', value: formData.city },
            { label: 'State', value: formData.state },
            { label: 'Pin Code', value: formData.pincode },
        ];

        personalInfo.forEach(item => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${item.label}:`, margin + 3, yPosition);
            pdf.setFont('helvetica', 'normal');
            const textValue = pdf.splitTextToSize(item.value, pageWidth - margin - 70);
            pdf.text(textValue, margin + 30, yPosition);
            yPosition += 6;
        });

        yPosition += 5;

        // ========== PLAYER INFORMATION ==========
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175);
        pdf.text('PLAYER INFORMATION', margin, yPosition);
        yPosition += 7;

        pdf.setDrawColor(30, 64, 175);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        const playerInfo = [
            { label: 'Handed', value: formData.handed },
            { label: 'Specialist In', value: formData.specialist },
            { label: 'Jersey Size', value: formData.jerseySize },
        ];

        playerInfo.forEach(item => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${item.label}:`, margin + 3, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.value, margin + 30, yPosition);
            yPosition += 6;
        });

        if (formData.achievement && formData.achievement.trim()) {
            yPosition += 2;
            pdf.setFont('helvetica', 'bold');
            pdf.text('Achievements:', margin + 3, yPosition);
            yPosition += 5;
            pdf.setFont('helvetica', 'normal');
            const achievementLines = pdf.splitTextToSize(formData.achievement, pageWidth - 2 * margin - 6);
            pdf.text(achievementLines, margin + 3, yPosition);
            yPosition += achievementLines.length * 5;
        }

        yPosition += 8;

        // ========== ENTRY FEE BOX ==========
        pdf.setFillColor(30, 64, 175);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 18, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ENTRY FEE', pageWidth / 2, yPosition + 7, { align: 'center' });
        
        pdf.setFontSize(13);
        pdf.setTextColor(245, 158, 11);
        pdf.text('₹ 1,000/- PER PERSON', pageWidth / 2, yPosition + 14, { align: 'center' });

        yPosition += 25;

        // ========== IMPORTANT INFORMATION ==========
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175);
        pdf.text('IMPORTANT INFORMATION', margin, yPosition);
        yPosition += 6;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        const infoPoints = [
            '• Jersey, Shorts & Food provided for all participants',
            '• Last Date For Registration: 01-04-2026',
            '• Send this form to: kanmani3153@gmail.com',
            '• Address: Room #51, Sree Kanteerava Outdoor Stadium, Bengaluru - 560001',
            '• For queries: 9972888592 / 9916659636'
        ];

        infoPoints.forEach(point => {
            const lines = pdf.splitTextToSize(point, pageWidth - 2 * margin);
            pdf.text(lines, margin + 2, yPosition);
            yPosition += lines.length * 4.5;
        });

        yPosition += 8;

        // ========== SIGNATURE ==========
        if (signatureDataURL) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Applicant Signature:', margin, yPosition);
            
            // Add signature image
            pdf.addImage(signatureDataURL, 'PNG', margin + 42, yPosition - 4, 45, 12);
            
            // Signature line
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.3);
            pdf.line(margin + 42, yPosition + 9, margin + 87, yPosition + 9);
        }

        yPosition += 15;

        // ========== FOOTER ==========
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('This is a computer-generated document. No physical signature required.', pageWidth / 2, pageHeight - 12, { align: 'center' });
        pdf.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Bangalore Throwball Premier League • Youngsters Sports Club', pageWidth / 2, pageHeight - 4, { align: 'center' });

        // ========== SAVE PDF ==========
        pdf.save(`BTPL_Registration_${formData.registrationID}.pdf`);

        console.log('✅ PDF generated successfully!');

    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        alert('❌ Error generating PDF. Please try again or contact support.');
    }
}

// ==================== MODAL CONTROLS ====================
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const successModal = document.getElementById('successModal');

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePDF);
}

if (closeSuccessModal && successModal) {
    closeSuccessModal.addEventListener('click', () => {
        successModal.style.display = 'none';
        location.reload(); // Reload page for new registration
    });
}

// Close modal when clicking outside
if (successModal) {
    window.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.style.display = 'none';
            location.reload();
        }
    });
}

// ==================== REAL-TIME INPUT VALIDATION ====================
const inputs = document.querySelectorAll('input[required], textarea[required]');
inputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (!input.value.trim()) {
            input.style.borderBottomColor = '#dc2626';
        } else {
            input.style.borderBottomColor = '#10b981';
        }
    });
    
    input.addEventListener('input', () => {
        if (input.value.trim()) {
            input.style.borderBottomColor = '#10b981';
        }
    });
});

// ==================== PHONE NUMBER FORMATTING ====================
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        e.target.value = value;
    });
}

// ==================== PIN CODE VALIDATION ====================
const pincodeInput = document.getElementById('pincode');
if (pincodeInput) {
    pincodeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) {
            value = value.slice(0, 6);
        }
        e.target.value = value;
    });
}

// ==================== CONSOLE LOG ====================
console.log('✅ Form script loaded successfully');
console.log('📝 Signature canvas:', signatureCanvas ? 'Found' : 'Not found');
console.log('🔘 Clear button:', clearSignatureBtn ? 'Found' : 'Not found');
console.log('🖼️ Logo loading initialized');