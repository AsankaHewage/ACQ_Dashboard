function money(amount) {
    return "$" + Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function percent(value) {
    return value.toFixed(2) + "%";
}

var supplier = "ALL";
var charity = "ALL";
var month = 0;
var runSummary = function () {};
var runClient = function () {};
var runRaisedChart = function () {};

var is_summary_view = true;
var is_client_view = false;

//need to dynamic
var charities = [
    { id: "ALL", text: "ALL" },
    { id: "ALLKND", text: "ALLKND" },
    { id: "APWF", text: "APWF" },
    { id: "ARF", text: "ARF" },
    { id: "BZA", text: "BZA" },
    { id: "CHA", text: "CHA" },
    { id: "URC", text: "URC" },
    { id: "PBCF", text: "PBCF" }
];


$("#searchBox, #clientPicker").select2({
    placeholder: "Select clients...",
    allowClear: true,
    width: "100%",
    data: charities
});

//need to dynamic
var suppliers = [
    { id: "ALL", text: "All" },
    { id: "QUINN", text: "QDF" },
    { id: "BPO", text: "BPO" },
    { id: "IG", text: "IG" },
    { id: "DTS", text: "DTS" }
];

$("#clientAgency").select2({
    placeholder: "Select Supplier...",
    allowClear: true,
    width: "100%",
    data: suppliers
});

$("#searchBox, #clientPicker, #clientAgency").on("select2:select", function (e) {
    var selected = $(this).val() || [];
    var next = e.params.data.id === "ALL"
        ? ["ALL"]
        : selected.filter(function (id) { return id !== "ALL"; });

    if (next.join(",") !== selected.join(",")) {
        $(this).val(next).trigger("change");
    }
});

$("#raisedToggle").on("change", function () {
    var campaign = this.checked;
    
    $("#raisedChartTitle").text(campaign ? "Funds raised by campaign" : "Funds raised by charity");

    $("#raisedCharityLabel").toggleClass("on", !campaign);
    $("#raisedCampaignLabel").toggleClass("on", campaign);
    runRaisedChart();
});

//MONTH Picker

$(function () {
    $("#monthPills .pill").on("click", function () {
        $("#monthPills .pill").removeClass("active");
        $(this).addClass("active");
        month = $(this).data("month");
    
        if(is_summary_view) {
            runSummary();
        }
        else if(is_client_view) {
            runClient();
        }
    });
})


// SUMMARY VIEW. Call the chart functions from loadSummary's .done when you want them drawn.
$(function () {
    var COVE = { QUINN: "#6fa8dc", BPO: "#e8a33d", IG: "#2e9e52", DTS: "#2c8a9e" };

    var COVE_Charity = {
        ALLKND: "#3498DB",
        APWF: "#2ECC71",
        ARF: "#E67E22",
        BZA: "#9B59B6",
        CHA: "#E74C3C",
        URC: "#16A085",
        PBCF: "#F1C40F"
    };

    var COVE_Campaign = {
        110: "#3498DB",
        111: "#2ECC71",
        112: "#E67E22",
        113: "#9B59B6",
        114: "#E74C3C",
        115: "#16A085",
        116: "#F1C40F",
        117: "#E91E63",
        118: "#5DADE2",
        119: "#AF7AC5",
        120: "#F5B041"
    };

    var dashboard = null;
    var allSuppliers = [];

    var clientChart = null;
    var charityTable = null;
    var supplierChart = null;
    var trendChart = null;
    var summaryTimer = null;
    var summaryRequest = 0;

    function supplierColor(supplier) {
        return COVE[supplier] || "#9a9a93";//grey
    }

    function charityColor(charityName) {
        return COVE_Charity[charityName] || "#9a9a93";//grey
    }

    function loadSummary() {
        var request = ++summaryRequest;
        clearTimeout(summaryTimer);

        $('#summaryLoading').show();
        $('#summaryView').hide();
        $('#monthRange').text('');
        $('#summaryLoadingMessage').html("Fetching data for<br><strong>Supplier:</strong> " + supplier + "<br><strong>Charities:</strong> " + charity);

            summaryTimer = setTimeout(function () {
                if (request !== summaryRequest || !is_summary_view) return;

                $.getJSON($("#main").data("dashboardUrl"), { supplier: supplier, charity: charity, month: month })
                .done(function (data) {
                    if (!is_summary_view) return;

                    var range = data.datePicker[0];
                    $('#monthRange').text(range.start_date.substring(0, 10) + " - " + range.end_date.substring(0, 10))

                    dashboard = data;
                    allSuppliers = data.raisedBySupplier || [];
    
                    $('#kpiRaised').text(money(dashboard.summary[0].total_donation_amount));
                    $('#kpiDonations').text(dashboard.summary[0].total_donation_count);
                    $('#kpiAvgGift').text(money(dashboard.summary[0].avg_gift));
                    $('#kpiClients').text(dashboard.summary[0].client_count);
    
                    //to dynamic (soon)
                    var kpi_return = 0;
                    $('#kpiReturn').text(percent(kpi_return));
                    if (kpi_return <= 30) {
                        $('#kpiReturn').addClass('neg');
                    }
                    else {
                        $('#kpiReturn').addClass('pos');
                    }
    
                    //load charts
                    chartRaisedBySupplier()
                    showSupplierLegend()
                    chartRaisedByCharity();
                    chartTrend();
                    fillCharityTable();
    
                    $('#summaryLoading').hide();
                    $('#summaryView').show();

                });


            }, 1000);
    }

    function chartTrend() {
        var summary = dashboard && dashboard.summary[0];

        if (!summary || !$("#trendChart").length) return;

        if (trendChart) trendChart.destroy();

        trendChart = new Chart($("#trendChart")[0], {
            type: "line",
            data: {
                labels: ["3 months ago", "2 months ago", "Last month"],
                datasets: [{
                    data: [summary.l3p_L3r_perc, summary.l2p_L2r_perc, summary.l1p_L1r_perc],
                    borderColor: "#2c8a9e",
                    backgroundColor: "rgba(44,138,158,0.12)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: "#2c8a9e"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: "#2c2c2a" }, ticks: { color: "#9a9a93", callback: function (value) { return value + "%"; } } },
                    x: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    function chartRaisedByCharity() {
        var campaign = $("#raisedToggle").prop("checked");

        var rows = campaign ? (dashboard && dashboard.raisedByCampaign) : (dashboard && dashboard.raisedByCharity);

        if (!rows || !$("#clientChart").length) return;

        if (clientChart) clientChart.destroy();

        clientChart = new Chart($("#clientChart")[0], {
            type: "bar",
            data: {
                labels: $.map(rows, function (row) {
                    return campaign ? row.bankingProductType + " (" + row.listNo + ")" : row.charity;
                }),
                datasets: [{
                    data: $.map(rows, function (row) { return row.total_donation_amount; }),
                    backgroundColor: $.map(rows, function (row) {
                        return campaign ? (COVE_Campaign[row.listNo] || "#9a9a93") : charityColor(row.charity);
                    }),
                    borderRadius: 4,
                    maxBarThickness: 34
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false } ,
                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                var cont = context.parsed.y.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });

                                return [
                                    "Raised: $" + cont,
                                    "Donations: " + rows[context.dataIndex].total_donation_count
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#2c2c2a" }, ticks: { color: "#9a9a93" } },
                    x: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    function chartRaisedBySupplier() {
        var names = ["QUINN", "BPO", "DTS", "IG"];
        var byName = {};
        var labels = [];
        var amounts = [];
        var colors = [];

        $.each(allSuppliers, function (i, row) {
            byName[row.supplier] = row;
        });

        $.each(names, function (i, name) {
            var row = byName[name];
            labels.push(name === "QUINN" ? "QDF" : name);
            amounts.push(row ? row.total_donation_amount : 0);
            colors.push(supplierColor(name));
        });

        if (supplierChart) supplierChart.destroy();

        supplierChart = new Chart($("#supplierChart")[0], {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderColor: "#1e1e1e",
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    function showSupplierLegend() {

        $("#supplierLegend").empty();

        $.each(dashboard.raisedBySupplier, function (i, row) {

            var name = row.supplier === "QUINN" ? "QDF" : row.supplier;
            name = name == "" ? "Unknown": name;

            $("#supplierLegend").append(
                "<span><span class='dot' style='background:" + supplierColor(row.supplier) + "'></span>"
                + name + " " + percent(row.donation_percent) + "</span>"
            );
        });
    }

    function selectAgencyPills() {
        //ALL is default
        $("#agencyPills .pill").on("click", function () {
            var picked = $(this).data("supplier");
            $(this).toggleClass("active");

            if (picked === "ALL" && $(this).hasClass("active")) {
                $("#agencyPills .pill").not(this).removeClass("active");
            } else if ($(this).hasClass("active")) {
                $("#agencyPills .pill[data-supplier='ALL']").removeClass("active");
            }

            if ($("#agencyPills .pill.active").length === 0) {
                $("#agencyPills .pill[data-supplier='ALL']").addClass("active");
            }

            var selected = [];

            $("#agencyPills .pill.active").each(function () {
                selected.push($(this).data("supplier"));
            });

            supplier = selected.join(",");

            loadSummary();
        });
    }

    function fillCharityTable() {
        if (charityTable) {
            charityTable.destroy();
            charityTable = null;
        }

        $("#clientTable tbody").empty();

        $.each(dashboard.raisedByCharityList, function (i, row) {

            var name = row.supplier === "QUINN" ? "QDF" : row.supplier;
            name = name == "" ? "Unknown": name;
            var actual_name = row.supplier == "" ? "Unknown": row.supplier;

            var campaign = row.bankingProductType + " (" + row.listNo + ")";

            var perc = 0;
            var pos_neg = 'pos';

            if (perc <= 30) {
                pos_neg = 'neg'
            }
        
            $("#clientTable tbody").append(
                "<tr>"
                + "<td>" + row.charity + "</td>"
                + "<td class='agency-badge badge-" + actual_name +"'>" + name + "</td>"
                + "<td>" + campaign + "</td>"
                + "<td data-order='" + row.total_donation_count + "'>" + row.total_donation_count + "</td>"
                + "<td data-order='" + row.total_donation_amount + "'>" + money(row.total_donation_amount) + "</td>"
                + "<td data-order='" + row.gift_avg + "'>" + money(row.gift_avg) + "</td>"
                + "<td class=" + pos_neg +" data-order='" + perc + "'>" + percent(perc) + "</td>"
                + "</tr>"
            );
        });

        charityTable = $("#clientTable").DataTable({
            paging: false,
            searching: false,
            info: false,
            order: [],
            autoWidth: false
        });
    }

    $(".viewtab").on("click", function () {
        if ($(this).data("view") !== "summary") return;
        $(".viewtab").removeClass("active");
        $(this).addClass("active");
        $("#summaryView, #agencyPills, .search-wrap").show();
        $("#clientView, .client-picker-wrap, #clientLoading").hide();

        is_summary_view = true;
        is_client_view = false;

        selectAllSummary();
        loadSummary();
    });

    function selectAllSummary() {
        $("#agencyPills .pill").removeClass("active");
        $("#agencyPills .pill[data-supplier='ALL']").addClass("active");
        $("#searchBox").val(["ALL"]).trigger("change.select2");
        supplier = "ALL";
        charity = "ALL";
    }


    $('#searchBox').on("change", function () {
        charity = ($(this).val() || ["ALL"]).join(",");
        loadSummary();
    });

    selectAgencyPills();
    selectAllSummary();
    loadSummary();
    runSummary = loadSummary;
    runRaisedChart = chartRaisedByCharity;
});



// CLIENT VIEW. Set charity, then the Client view tab calls loadClientView.
$(function () {
    var clientDashboard = null;
    var channelChart = null;
    var tierChart = null;
    var retChart = null;
    var clientTimer = null;
    var clientRequest = 0;

    function loadClientView() {
        if (!charity) return;

        var request = ++clientRequest;
        clearTimeout(clientTimer);

        $("#clientView").show();
        $("#clientDetail").hide();
        $('#monthRange').text('');
        $("#clientLoading").show();
        $("#clientLoadingMessage").html("Fetching data for<br><strong>Supplier:</strong> " + supplier + "<br><strong>Charities:</strong> " + charity);

        clientTimer = setTimeout(function () {
            if (request !== clientRequest || !is_client_view) return;

            $.getJSON($("#main").data("dashboardUrl"), { supplier: supplier, charity: charity, month: month })
                .done(function (data) {
                    if (!is_client_view) return;

                    var range = data.datePicker[0];
                    $('#monthRange').text(range.start_date.substring(0, 10) + " - " + range.end_date.substring(0, 10))

                    clientDashboard = data;

                    $('#clientDonations').text(clientDashboard.summary[0].total_donation_count);
                    $('#clientRaised').text(money(clientDashboard.summary[0].total_donation_amount));
                    $('#clientAvgGift').text(money(clientDashboard.summary[0].avg_gift));
                    $('#clientTier50').text(clientDashboard.summary[0].tier50);
                    $('#clientTier100').text(clientDashboard.summary[0].tier100);
                    $('#clientTier200').text(clientDashboard.summary[0].tier200);

                    $("#mobileReach").text(clientDashboard.summary[0].mobile + " · " + percent(clientDashboard.summary[0].mobile_perc));
                    $("#mobileBar").css("width", clientDashboard.summary[0].mobile_perc + "%");
                    if (clientDashboard.summary[0].mobile_perc < 30) {
                        $("#mobileReach").addClass("neg");
                    }
                    else {
                        $("#mobileReach").removeClass("neg");
                    }

                    $("#emailReach").text(clientDashboard.summary[0].email + " · " + percent(clientDashboard.summary[0].email_perc));
                    $("#emailBar").css("width", clientDashboard.summary[0].email_perc + "%");
                    if (clientDashboard.summary[0].email_perc < 30) {
                        $("#emailReach").addClass("neg");
                    }
                    else {
                        $("#emailReach").removeClass("neg");
                    }

                    $("#dobReach").text(clientDashboard.summary[0].dob + " · " + percent(clientDashboard.summary[0].dob_perc));
                    $("#dobBar").css("width", clientDashboard.summary[0].dob_perc + "%");
                    if (clientDashboard.summary[0].dob_perc < 30) {
                        $("#dobReach").addClass("neg");
                    }
                    else {
                        $("#dobReach").removeClass("neg");
                    }

                    chartChannels();
                    chartTiers();
                    chartReturn();

                    $("#clientLoading").hide();
                    $("#clientView, #clientDetail").show();
                });
        }, 1000);
    }

    function clientSummary() {
        return clientDashboard && clientDashboard.summary[0];
    }

    function chartChannels() {
        var summary = clientSummary();
        if (!summary || !$("#channelChart").length) return;

        if (channelChart) channelChart.destroy();
        channelChart = new Chart($("#channelChart")[0], {
            type: "bar",
            data: {
                labels: ["Card/DD", "Sent out", "Web"],
                datasets: [{
                    data: [summary.cc_dd_total, summary.so_total, summary.ho_total],
                    backgroundColor: ["#6fa8dc", "#2c8a9e", "#9a9a93"],
                    borderRadius: 4,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                var cont = context.parsed.y.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });

                                var counts = [
                                    summary.cc_dd_donations,
                                    summary.so_donations,
                                    summary.ho_donations
                                ];

                                return [
                                    "Raised: $" + cont,
                                    "Donations: " + counts[context.dataIndex]
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#2c2c2a" }, ticks: { color: "#9a9a93" } },
                    x: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    function chartTiers() {
        var summary = clientSummary();
        if (!summary || !$("#tierChart").length) return;

        if (tierChart) tierChart.destroy();
        tierChart = new Chart($("#tierChart")[0], {
            type: "bar",
            data: {
                labels: ["$50+", "$100+", "$200+"],
                datasets: [{
                    data: [summary.tier50, summary.tier100, summary.tier200],
                    backgroundColor: "#6fa8dc",
                    borderRadius: 4,
                    maxBarThickness: 40
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: "#2c2c2a" }, ticks: { color: "#9a9a93" } },
                    y: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    function chartReturn() {
        var summary = clientSummary();
        if (!summary || !$("#retChart").length) return;

        if (retChart) retChart.destroy();
        retChart = new Chart($("#retChart")[0], {
            type: "line",
            data: {
                labels: ["3 months ago", "2 months ago", "Last month"],
                datasets: [{
                    data: [summary.l3p_L3r_perc, summary.l2p_L2r_perc, summary.l1p_L1r_perc],
                    borderColor: "#2e9e52",
                    backgroundColor: "rgba(46,158,82,0.12)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: "#2e9e52"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: "#2c2c2a" }, ticks: { color: "#9a9a93", callback: function (value) { return value + "%"; } } },
                    x: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    $(".viewtab").on("click", function () {
        if ($(this).data("view") !== "client") return;
        $(".viewtab").removeClass("active");
        $(this).addClass("active");
        $(".client-picker-wrap, #clientView").show();
        $("#clientDetail, #summaryView, #agencyPills, .search-wrap, #summaryLoading").hide();

        is_client_view = true;
        is_summary_view = false;

        $("#clientPicker, #clientAgency").val(["ALL"]).trigger("change.select2");
        supplier = "ALL";
        charity = "ALL";

        loadClientView();
    });

    $('#clientPicker').on("change", function () {
        charity = ($(this).val() || ["ALL"]).join(",");
        loadClientView();
    });

    $('#clientAgency').on("change", function () {
        supplier = ($(this).val() || ["ALL"]).join(",");
        loadClientView();
    });

    runClient = loadClientView;
});


