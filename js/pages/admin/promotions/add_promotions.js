import CONFIG from "../../../utils/settings.js";
import { showToast } from "../../../components/toast.js";

const API_BASE = CONFIG.BASE_URL + "/api";

// Khai báo các biến
const matchBulkSel = document.getElementById("match_bulk");
const sectionMatchSel = document.getElementById("section_match");
const typeSelect = document.getElementById("discount_type");
const now = new Date().toISOString().slice(0, 16);
const backBtn = document.getElementById("btn-back");

// Hàm lấy danh sách match từ API
async function fetchMatches() {
    try {
        const resp = await fetch(`${API_BASE}/promotions/match/`);
        if (!resp.ok) throw new Error(`Lỗi khi fetch matches: ${resp.status}`);
        const data = await resp.json();
        return data.results || data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Hàm lấy danh sách section theo match_id từ API
async function fetchSections(matchId) {
    try {
        const resp = await fetch(`${API_BASE}/promotions/section/?match=${matchId}`);
        if (!resp.ok) throw new Error(`Lỗi khi fetch sections: ${resp.status}`);
        const data = await resp.json();
        return data.results || data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// Hàm kiểm tra trùng line
function hasDuplicateLines(lines) {
    const seen = new Set();
    for (const { match, section } of lines) {
        const key = `${match}-${section}`;
        if (seen.has(key)) return true;
        seen.add(key);
    }
    return false;
}

// Hàm thiết lập giá trị tối đa cho discount_value dựa trên discount_type
function setMaxValue(discountType) {
    const valueInput = document.getElementById("discount_value");
    if (!valueInput) return;
    if (discountType === "percentage") {
        valueInput.max = 100;
        valueInput.min = 1;
    } else {
        valueInput.max = 10000000;
        valueInput.min = 10000;
    }
}

// Tạo một dòng (li) trong danh sách áp dụng
function createAppliedRow(matchId, sectionId, displayText) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.setAttribute("data-match", matchId);
    li.setAttribute("data-section", sectionId);
    const spanText = document.createElement("span");
    spanText.className = "applied-text";
    spanText.textContent = displayText;
    li.appendChild(spanText);
    const btnRemove = document.createElement("button");
    btnRemove.className = "btn btn-sm btn-outline-danger remove-applied";
    btnRemove.type = "button";
    btnRemove.innerHTML = `<i class="bi bi-x-circle"></i>`;
    btnRemove.addEventListener("click", () => {
        li.remove();
    });
    li.appendChild(btnRemove);
    return li;
}

// --- Hàm lấy danh sách applied lines đã xử lý ---
// Nếu section được chọn là "0" (All Section), ta sẽ gọi API fetchSections để lấy tất cả các section của match đó
async function getProcessedAppliedLines() {
    const lines = [];
    const appliedItems = appliedList.querySelectorAll("li");
    for (const li of appliedItems) {
        const matchIdStr = li.getAttribute("data-match");
        const sectionIdStr = li.getAttribute("data-section");
        const matchId = parseInt(matchIdStr, 10);
        // Nếu section = "0", lấy tất cả section của match đó từ API
        if (sectionIdStr === "0") {
            const sections = await fetchSections(matchIdStr);
            sections.forEach((section) => {
                lines.push({ match: matchId, section: parseInt(section.section_id, 10) });
            });
        } else {
            const sectionId = parseInt(sectionIdStr, 10);
            if (!isNaN(matchId) && !isNaN(sectionId)) {
                lines.push({ match: matchId, section: sectionId });
            }
        }
    }
    return lines;
}

// Hàm load option cho select theo match (cho cả tab Bulk và Section)
async function loadMatchOptions(selectElement) {
    const matches = await fetchMatches();
    // Xóa option cũ
    selectElement.innerHTML = '<option value="">--Chọn Match--</option>';
    matches.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.match_id;
        opt.textContent = `${m.display} — ${m.match_time_fmt}`;
        selectElement.appendChild(opt);
    });
}

// Khi chọn match trong tab "Theo khu vực", load danh sách section tương ứng
async function loadSectionsForMatch() {
    const sectionMatchSel = document.getElementById("section_match");
    const sectionSectionSel = document.getElementById("section_section");
    const matchId = sectionMatchSel.value;
    // Xóa danh sách cũ
    sectionSectionSel.innerHTML = '<option value="">--Chọn Section--</option>';
    if (matchId) {
        const sections = await fetchSections(matchId);
        sections.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.section_id; // điều chỉnh theo trường của API
            opt.textContent = s.section_name; // điều chỉnh theo trường của API
            sectionSectionSel.appendChild(opt);
        });
    }
}


document.addEventListener("DOMContentLoaded", async () => {

    // Thiết lập các ràng buộc value
    document.getElementById("start_time").setAttribute("min", now);
    document.getElementById("end_time").setAttribute("min", now);

    setMaxValue(typeSelect.value);
    typeSelect.addEventListener("change", (e) => {
        setMaxValue(e.target.value);
    });

    // Khởi tạo tooltip nếu có
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
        new bootstrap.Tooltip(el);
    });

    // Load option cho tab Bulk: match_bulk
    await loadMatchOptions(matchBulkSel);

    // Load option cho tab Theo khu vực: section_match
    await loadMatchOptions(sectionMatchSel);

    // Khi user thay đổi match ở tab "Theo khu vực", cập nhật danh sách section
    sectionMatchSel.addEventListener("change", loadSectionsForMatch);

    // Bấm “Trở về danh sách”
    backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const role = localStorage.getItem("role");
        if (role === "staff") {
            window.location.href = "/pages/staff/base.html#promotions/promotions"; // Trang chính của staff
        } else {
            window.location.href = "/pages/admin/base.html#promotions/promotions"; // Trang chính của admin
        }
    });
});

// --- Xử lý danh sách áp dụng ---
const appliedList = document.getElementById("appliedList");

// Xử lý thêm dòng "Bulk All": Khi chọn match ở tab Bulk, thêm dòng với section = "0" (All Section)
document.getElementById("btnBulkApply")?.addEventListener("click", () => {
    const matchBulkSel = document.getElementById("match_bulk");
    if (!matchBulkSel.value) {
        alert("Chưa chọn match để bulk");
        return;
    }

    const selectedMatchId = matchBulkSel.value;
    const selectedMatchText = matchBulkSel.options[matchBulkSel.selectedIndex].text;

    let existingLi = Array.from(appliedList.children).find(
        (li) => li.getAttribute("data-match") === selectedMatchId
    );
    if (existingLi) {
        existingLi.querySelector(".applied-text").textContent = `${selectedMatchText} - All Section`;
        existingLi.setAttribute("data-section", "0");
    } else {
        const li = createAppliedRow(selectedMatchId, "0", `${selectedMatchText} - All Section`);
        appliedList.appendChild(li);
    }
});

// Xử lý thêm dòng "Theo Section": Dựa vào select section_match và section_section
document.getElementById("btnApplySection")?.addEventListener("click", () => {
    const matchId = sectionMatchSel.value; // match id
    const sectionId = document.getElementById("section_section").value; // section id
    
    if (!matchId || !sectionId) {
        alert("Chọn match và section trước khi áp dụng!");
        return;
    }

    const selectedMatchText =
        sectionMatchSel.options[sectionMatchSel.selectedIndex].text;
    const selectedSectionText =
        document.getElementById("section_section").options[
            document.getElementById("section_section").selectedIndex
        ].text;

    let existsAll = Array.from(appliedList.children).some(
        (li) =>
            li.getAttribute("data-match") === matchId &&
            li.getAttribute("data-section") === "0" // giả sử "All Section" là 0
    );
    if (existsAll && sectionId !== "0") {
        showToast(
            `Đã có '${selectedMatchText} - All Section' trong danh sách, không thể thêm chi tiết!`,
            "danger"
        );
        return;
    }
    let exists = Array.from(appliedList.children).some(
        (li) =>
            li.getAttribute("data-match") === matchId &&
            li.getAttribute("data-section") === sectionId
    );
    if (exists) {
        showToast("Sự kết hợp match và section này đã tồn tại!", "danger");
        return;
    }
    const displayText = `${selectedMatchText} - ${selectedSectionText}`;
    const li = createAppliedRow(matchId, sectionId, displayText);
    appliedList.appendChild(li);
});

// Xử lý submit form tạo Promotion
document.getElementById("promotion-form")?.addEventListener("submit", async (e) => {
    const form = document.getElementById("promotion-form");

    // Kích hoạt HTML5/Bootstrap validation
    if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        form.classList.add("was-validated");
        return;
    }

    // Validate thời gian: start_time phải trước end_time
    const startInput = document.getElementById("start_time");
    const endInput = document.getElementById("end_time");
    if (new Date(startInput.value) >= new Date(endInput.value)) {
        e.preventDefault();
        e.stopPropagation();
        endInput.classList.add("is-invalid");
        form.classList.add("was-validated");
        return;
    } else {
        endInput.classList.remove("is-invalid");
    }

    // Kiểm tra discount_value
    const valueInput = document.getElementById("discount_value");
    if (parseFloat(valueInput.value) > parseFloat(valueInput.max)) {
        e.preventDefault();
        e.stopPropagation();
        valueInput.classList.add("is-invalid");
        form.classList.add("was-validated");
        return;
    } else {
        valueInput.classList.remove("is-invalid");
    }

    e.preventDefault();

    // Lấy dữ liệu từ form
    const promo_code = document.getElementById("promo_code").value.toUpperCase();
    const discount_value = parseFloat(document.getElementById("discount_value").value);
    const discount_type = document.getElementById("discount_type").value;
    const start_time = document.getElementById("start_time").value;
    const end_time = document.getElementById("end_time").value;
    const description = document.getElementById("description")?.value || "";
    const usage_limit = parseInt(document.getElementById("usage_limit").value) || 10;

    // Gọi hàm getProcessedAppliedLines để lấy dữ liệu lines
    const lines = await getProcessedAppliedLines();

    if (hasDuplicateLines(lines)) {
        showToast("Match-Section trùng nhau. Vui lòng kiểm tra lại.", "warning");
        return;
    }

    console.log("LocalStorage:", localStorage);

    // Tạo payload
    const payload = {
        promo_code,
        discount_value,
        discount_type,
        start_time,
        end_time,
        description,
        usage_limit,
        user_id: localStorage.getItem("employee_id"),
        lines,
        status: false
    };

    try {
        console.log("Payload:", payload);
        const resp = await fetch(`${API_BASE}/promotions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (resp.ok) {
            showToast("Thêm Promotion thành công! Đang chuyển về trang danh sách...", "success", 3000);
            setTimeout(() => {
                if (localStorage.getItem("role") === "staff") {
                    window.location.href = "/pages/staff/base.html#promotions/promotions";
                }
                else if (localStorage.getItem("role") === "admin") {
                window.location.href = "/pages/admin/base.html#promotions/promotions";
                }
            }, 2000);
        } else {
            const err = await resp.json();
            const keys = Object.keys(err);
            let msg = "";
            const firstKey = keys[0];
            if (Array.isArray(err[firstKey]) && err[firstKey].length > 0) {
                msg = err[firstKey][0];
            } else {
                msg = err[firstKey];
            }
            showToast(msg, "danger");
        }
    } catch (err) {
        showToast("Không thể kết nối đến server.", "danger", );
        console.error(err);
    }
});

// Các kiểm tra input realtime
document.getElementById("promo_code").addEventListener("input", function () {
    if (this.validity.patternMismatch) {
        this.classList.add("is-invalid");
    } else {
        this.classList.remove("is-invalid");
    }
});

document.getElementById("discount_value").addEventListener("input", function () {
    const allowedMax = parseFloat(this.max);
    const currentVal = parseFloat(this.value);
    if (!isNaN(currentVal) && currentVal > allowedMax) {
        this.classList.add("is-invalid");
    } else {
        this.classList.remove("is-invalid");
    }
});

document.getElementById("start_time").addEventListener("input", function () {
    const startInput = this;
    const endInput = document.getElementById("end_time");
    if (endInput.value && new Date(startInput.value) >= new Date(endInput.value)) {
        startInput.classList.add("is-invalid");
    } else {
        startInput.classList.remove("is-invalid");
    }
});

document.getElementById("end_time").addEventListener("input", function () {
    const startInput = document.getElementById("start_time");
    const endInput = this;
    if (startInput.value && new Date(startInput.value) >= new Date(endInput.value)) {
        endInput.classList.add("is-invalid");
    } else {
        endInput.classList.remove("is-invalid");
    }
});
// AI PROMOTION
// --- LOGIC TÍCH HỢP AI ---

let aiChartInstance = null; // Biến toàn cục để lưu instance Chart.js

const aiContainer = document.getElementById("ai-analysis-container");
const aiElements = {
    tierBadge: document.getElementById("ai-tier-badge"),
    daysLeft: document.getElementById("ai-days-left"),
    fillRate: document.getElementById("ai-fill-rate"),
    soldStats: document.getElementById("ai-sold-stats"),
    available: document.getElementById("ai-available"),
    message: document.getElementById("ai-message"),
    bestDiscount: document.getElementById("ai-best-discount"),
    extraSold: document.getElementById("ai-extra-sold"),
    btnUse: document.getElementById("btn-use-ai-suggestion")
};

// 1. Khi chọn Match -> Gọi API AI
matchBulkSel.addEventListener("change", async () => {
    const matchId = matchBulkSel.value;
    
    // Ẩn bảng AI nếu chưa chọn hoặc reset
    if (!matchId) {
        aiContainer.style.display = "none";
        return;
    }

    // Hiển thị trạng thái loading (Optional: có thể thêm spinner)
    aiContainer.style.display = "block";
    aiElements.message.innerHTML = '<span class="spinner-border spinner-border-sm text-warning" role="status"></span> Đang phân tích dữ liệu thị trường...';
    aiElements.btnUse.disabled = true;

    try {
        await new Promise(resolve => setTimeout(resolve, 2000)); //
        const res = await fetch(`${API_BASE}/promotions/analyze/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ match_id: matchId })
        });

        if (!res.ok) {
            const err = await res.json();
            // Nếu lỗi (ví dụ: chưa mở bán vé), hiển thị thông báo lỗi
            aiContainer.style.display = "none";
            showToast(err.error || "Không thể phân tích trận đấu này", "warning");
            return;
        }

        const data = await res.json();
        renderAiAnalysis(data);

    } catch (err) {
        console.error("AI Error:", err);
        aiContainer.style.display = "none";
        showToast("Lỗi kết nối đến hệ thống AI", "danger");
    }
});

// 2. Hàm hiển thị dữ liệu AI lên giao diện
function renderAiAnalysis(data) {
    if (data.status === "warning") {
        // Trường hợp đã bán hết vé -> Chỉ hiện cảnh báo
        aiElements.message.innerText = data.message;
        aiElements.message.className = "alert alert-success border-start border-5 border-success mb-3";
        aiElements.btnUse.disabled = true;
        if(aiChartInstance) aiChartInstance.destroy();
        return;
    }

    const info = data.match_info;
    const rec = data.recommendation;
    const analysisData = data.analysis_data; // Lấy mảng dữ liệu phân tích
    // Fill thông tin cơ bản
    aiElements.tierBadge.innerText = info.tier;
    
    // Màu sắc badge theo Tier
    if (info.tier.includes("Tier 1")) aiElements.tierBadge.className = "badge bg-danger";
    else if (info.tier.includes("Tier 4")) aiElements.tierBadge.className = "badge bg-secondary";
    else aiElements.tierBadge.className = "badge bg-primary";

    aiElements.daysLeft.innerText = `${info.days_left} ngày`;
    // Màu sắc ngày: Gấp (<=3) thì đỏ
    aiElements.daysLeft.className = info.days_left <= 3 ? "text-danger fw-bold" : "text-primary fw-bold";

    aiElements.fillRate.innerText = `${info.fill_rate}%`;
    aiElements.soldStats.innerText = `${info.sold_real} / ${info.initial_supply}`;
    aiElements.available.innerText = info.available_real;

    // Fill lời khuyên & Đề xuất
    aiElements.message.innerHTML = rec.message;
    // Reset style alert về mặc định
    aiElements.message.parentElement.className = "alert alert-light border-start border-5 border-warning mb-3";

    aiElements.bestDiscount.innerText = `Giảm ${rec.best_discount}%`;
    aiElements.extraSold.innerText = rec.expected_extra_sold;

    // Enable nút "Sử dụng"
    aiElements.btnUse.disabled = false;
    
    // Lưu giá trị đề xuất vào data attribute của nút để dùng sau
    aiElements.btnUse.dataset.discount = rec.best_discount;
    if (analysisData && analysisData.length > 0) {
        renderAiChart(analysisData, rec.best_discount);
    }
}

// 3. Xử lý khi bấm nút "Sử dụng đề xuất"
// --- HÀM TIỆN ÍCH: BỎ DẤU TIẾNG VIỆT & KÝ TỰ ĐẶC BIỆT ---
function cleanString(str) {
    return str.normalize('NFD') // Tách dấu ra khỏi chữ
              .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
              .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý chữ đ/Đ
              .replace(/\(.*?\)/g, "") // Xóa nội dung trong ngoặc đơn (VD: "(Bóng rổ)")
              .replace(/[^a-zA-Z0-9]/g, "") // Chỉ giữ lại chữ và số (Xóa khoảng trắng, dấu -, ...)
              .toUpperCase(); // Viết hoa toàn bộ
}

// 3. Xử lý khi bấm nút "Sử dụng đề xuất"
aiElements.btnUse.addEventListener("click", () => {
    const discount = aiElements.btnUse.dataset.discount;
    
    if (discount) {
        // Điền vào form
        document.getElementById("discount_type").value = "percentage";
        document.getElementById("discount_value").value = discount;
        
        // --- LOGIC TẠO MÃ CODE ĐẸP HƠN ---
        const matchText = matchBulkSel.options[matchBulkSel.selectedIndex].text;
        // Lấy tên trận đấu (bỏ phần giờ phía sau dấu gạch ngang)
        let rawName = matchText.split("—")[0]; 
        
        // Làm sạch chuỗi
        const cleanName = cleanString(rawName); 
        
        // Lấy tối đa 12 ký tự để mã không quá dài
        const shortName = cleanName.substring(0, 12); 
        
        // Kết quả: HOT50_TEAMBR5VSTEAMBR4
        document.getElementById("promo_code").value = `HOT${discount}_${shortName}`;
        
        // Tạo mô tả
        document.getElementById("description").value = `Ưu đãi 'nóng' giảm ${discount}% cho trận ${matchText.split("—")[0].trim()}. Số lượng có hạn!`;

        showToast("Đã áp dụng đề xuất của AI!", "success");
        
        // Trigger validate UI
        document.getElementById("discount_value").classList.remove("is-invalid");
        document.getElementById("promo_code").dispatchEvent(new Event('input')); // Trigger check pattern
    }
});
// --- HÀM MỚI: VẼ BIỂU ĐỒ CHART.JS ---
function renderAiChart(analysisData, bestDiscount) {
    const ctx = document.getElementById('aiChart').getContext('2d');

    // 1. Hủy biểu đồ cũ nếu tồn tại (để tránh lỗi hiển thị chồng đè khi hover)
    if (aiChartInstance) {
        aiChartInstance.destroy();
    }

    // 2. Chuẩn bị dữ liệu
    const labels = analysisData.map(item => `Giảm ${item.discount}%`);
    const revenueData = analysisData.map(item => item.extra_revenue);
    const fillRateData = analysisData.map(item => item.final_fill_rate);

    // Tạo mảng màu: Cột nào là Best Discount thì màu Xanh, còn lại màu Xám
    const barColors = analysisData.map(item => 
        item.discount === bestDiscount ? 'rgba(25, 135, 84, 0.8)' : 'rgba(108, 117, 125, 0.3)'
    );

    // 3. Khởi tạo Chart
    aiChartInstance = new Chart(ctx, {
        type: 'bar', // Dạng biểu đồ cột kết hợp đường
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu tăng thêm (VNĐ)',
                    data: revenueData,
                    backgroundColor: barColors,
                    borderColor: barColors.map(c => c.replace('0.3', '1').replace('0.8', '1')),
                    borderWidth: 1,
                    order: 2,
                    yAxisID: 'y', // Trục Y trái
                },
                {
                    type: 'line', // Đường biểu diễn tỷ lệ lấp đầy
                    label: 'Tỷ lệ lấp đầy (%)',
                    data: fillRateData,
                    borderColor: '#ffc107', // Màu vàng
                    backgroundColor: '#ffc107',
                    borderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3, // Đường cong mềm mại
                    order: 1,
                    yAxisID: 'y1' // Trục Y phải
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'y') {
                                // Format tiền Việt
                                label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.raw);
                            } else {
                                // Format phần trăm
                                label += context.raw + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Doanh thu' },
                    ticks: {
                        callback: function(value) {
                            // Rút gọn số tiền (VD: 10M, 20M)
                            return value / 1000000 + ' Tr'; 
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: '% Lấp đầy' },
                    grid: { drawOnChartArea: false }, // Ẩn lưới trục phải cho đỡ rối
                    min: 0,
                    max: 100 // Tỷ lệ max luôn là 100%
                }
            }
        }
    });
}