function money(amount) {
    return "$" + Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function percent(value) {
    return value.toFixed(2) + "%";
}

function monthYearName(value) {
    var text = String(value || "").substring(0, 10);
    var month = parseInt(text.substring(5, 7), 10);
    var year = parseInt(text.substring(0, 4), 10);
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return names[month - 1] + " " + year;
}

function monthYearDateLabel(value) {
    var text = String(value || "").substring(0, 10);
    var month = parseInt(text.substring(5, 7), 10);
    var year = parseInt(text.substring(0, 4), 10);
    var day = parseInt(text.substring(8, 10), 10);
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return names[month - 1] + " " + day + ", " + year;
}

var supplier = "ALL";
var charity = "ALL";
var campaign = "ALL";
var month = 0;
var runSummary = function () {};
var runClient = function () {};
var runRaisedChart = function () {};

var is_summary_view = true;
var is_client_view = false;

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

$("#clientAgency").on("select2:select", function (e) {
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
    $("#periodFilter").on("change", function () {
        month = parseInt($(this).val(), 10) || 0;
    });

    $("#applyFilters").on("click", function () {
        month = parseInt($("#periodFilter").val(), 10) || 0;
        if (is_summary_view) runSummary();
        else if (is_client_view) runClient();
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
    var fundraiserTable = null;
    var supplierChart = null;
    var trendChart = null;
    var stateChart = null;
    var genderChart = null;
    var summaryTimer = null;
    var summaryRequest = 0;
    var fillingFilters = false;

    function paintMulti(select) {
        var values = $(select).val() || ["ALL"];
        var labels = [];
        $(select).find("option").each(function () {
            if (values.indexOf(this.value) >= 0) labels.push($(this).text());
        });
        var wrap = $(select).closest(".filter-multi");
        wrap.find(".filter-multi-face").text(labels.join(", "));
        wrap.find(".filter-multi-option").each(function () {
            $(this).toggleClass("on", values.indexOf(String($(this).data("value"))) >= 0);
        });
    }

    function selectedJoin(select) {
        var values = $(select).val() || [];
        if (!values.length) {
            $(select).val(["ALL"]).trigger("multi:sync");
            return "ALL";
        }
        return values.join(",");
    }

    function fillFilter(selector, allLabel, rows, map) {
        var select = $(selector);
        if (select.data("filled") || !rows || !rows.length) return;

        select.empty().append($("<option>", { value: "ALL", text: allLabel }));
        $.each(rows, function (_, row) {
            var item = map(row);
            if (!item.value) return;
            select.append($("<option>", { value: item.value, text: item.text }));
        });

        if (!select.parent().hasClass("filter-multi")) {
            select.wrap("<div class='filter-multi'></div>");
            select.before("<button type='button' class='filter-multi-face'></button><div class='filter-multi-menu'></div>");
        }

        var menu = select.siblings(".filter-multi-menu").empty();
        select.find("option").each(function () {
            menu.append(
                $("<button type='button' class='filter-multi-option'></button>")
                    .attr("data-value", this.value)
                    .text($(this).text())
            );
        });

        select.val(["ALL"]);
        paintMulti(select);
        select.data("filled", true);
    }

    function fillSummaryFilters(data) {
        fillingFilters = true;
        fillFilter("#clientFilter", "All clients", data.allCharities, function (row) {
            return { value: row.charity, text: row.charity };
        });
        fillFilter("#supplierFilter", "All suppliers", data.allSuppliers, function (row) {
            var name = row.supplier === "QUINN" ? "QDF" : row.supplier;
            return { value: row.supplier, text: name || "Unknown" };
        });
        fillFilter("#campaignFilter", "All campaigns", data.allCampaigns, function (row) {
            return {
                value: String(row.listNo),
                text: row.bankingProductType + " (" + row.listNo + ")"
            };
        });
        fillingFilters = false;
    }

    $("#clientFilter, #supplierFilter, #campaignFilter").on("change multi:sync", function () {
        paintMulti(this);
    });

    $(".filter-grid").on("click", ".filter-multi-face", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = $(this).closest(".filter-multi");
        var open = wrap.hasClass("open");
        $(".filter-multi").removeClass("open");
        wrap.toggleClass("open", !open);
    });

    $(".filter-grid").on("click", ".filter-multi-menu", function (e) {
        e.stopPropagation();
    });

    $(".filter-grid").on("click", ".filter-multi-option", function () {
        var select = $(this).closest(".filter-multi").find("select");
        var id = String($(this).data("value"));
        var current = select.val() || [];
        var next;

        if (id === "ALL") {
            next = ["ALL"];
        } else {
            next = current.filter(function (value) { return value !== "ALL"; });
            var index = next.indexOf(id);
            if (index >= 0) next.splice(index, 1);
            else next.push(id);
            if (!next.length) next = ["ALL"];
        }

        select.val(next).trigger("change");
    });

    $(document).on("click", function () {
        $(".filter-multi").removeClass("open");
    });

    $("#clientFilter").on("change", function () {
        charity = selectedJoin(this);
    });

    $("#supplierFilter").on("change", function () {
        supplier = selectedJoin(this);
    });

    $("#campaignFilter").on("change", function () {
        campaign = selectedJoin(this);
    });

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
        $('#summaryLoadingMessage').html("Fetching data for<br><strong>Supplier:</strong> " + supplier + "<br><strong>Charities:</strong> " + charity + "<br><strong>Campaigns:</strong> " + campaign);

            summaryTimer = setTimeout(function () {
                if (request !== summaryRequest || !is_summary_view) return;

                $.ajax({
                    url: dashboardUrl,
                    type: "GET",
                    dataType: "json",
                    data: { supplier: supplier, charity: charity, campaign: campaign, month: month }
                })
                .done(function (data) {
                    if (!is_summary_view) return;

                    var range = data.datePicker[0];
                    $('#monthRange').text(monthYearDateLabel(range.start_date) + " - " + monthYearDateLabel(range.end_date))

                    dashboard = data;
                    allSuppliers = data.raisedBySupplier || [];
                    fillSummaryFilters(data);
    
                    $('#kpiRaised').text(money(dashboard.summary[0].total_donation_amount));
                    $('#kpiDonations').text(dashboard.summary[0].total_donation_count);
                    $('#kpiAvgGift').text(money(dashboard.summary[0].avg_gift));
                    $('#kpiTier50less').text(dashboard.summary[0].tier50less);
                    $('#kpiTier50').text(dashboard.summary[0].tier50);
                    $('#kpiTier100').text(dashboard.summary[0].tier100);
                    $('#kpiTier200').text(dashboard.summary[0].tier200);
    
                    //to dynamic (soon)
                    var kpi_declined_rate = dashboard.summary[0].total_declined_rate;
                    $('#kpiDeclinedRate').text(percent(kpi_declined_rate)+" ("+dashboard.summary[0].total_declined_count+")");
                    if (true) {
                        $('#kpiDeclinedRate').addClass('neg');
                    }
    
                    //load charts
                    chartRaisedBySupplier()
                    showSupplierLegend()
                    chartRaisedByCharity();
                    chartTrend();
                    fillCharityTable();
                    fillFundraiserTable();
    
                    $('#summaryLoading').hide();
                    $('#summaryView').show();
                    chartDemographics();

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
                labels: [monthYearName(summary.l7date), monthYearName(summary.l6date), monthYearName(summary.l5date), monthYearName(summary.l4date), monthYearName(summary.l3date), monthYearName(summary.l2date)],
                datasets: [{
                    data: [summary.l7p_L7r_perc, summary.l6p_L6r_perc, summary.l5p_L5r_perc, summary.l4p_L4r_perc, summary.l3p_L3r_perc, summary.l2p_L2r_perc],
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

    function chartDemographics() {
        var pieOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#9a9a93", boxWidth: 10, padding: 12, font: { size: 12 } }
                }
            }
        };

        var stateRows = (dashboard && dashboard.stateDemographics) || [];
        var stateColors = {
            NSW: "#6fa8dc",
            VIC: "#2c8a9e",
            QLD: "#e8a33d",
            WA: "#2e9e52",
            SA: "#9b59b6",
            TAS: "#e74c3c",
            ACT: "#16a085",
            NT: "#f1c40f"
        };
        var stateFallback = ["#6fa8dc", "#2c8a9e", "#e8a33d", "#2e9e52", "#9b59b6", "#e74c3c", "#16a085", "#f1c40f", "#9a9a93"];

        if ($("#stateChart").length) {
            if (stateChart) stateChart.destroy();
            stateChart = null;
            if (stateRows.length) {
                stateChart = new Chart($("#stateChart")[0], {
                    type: "pie",
                    data: {
                        labels: $.map(stateRows, function (row) {
                            return (row.state || "Unknown") + " " + percent(Number(row.percentage) || 0);
                        }),
                        datasets: [{
                            data: $.map(stateRows, function (row) { return row.total; }),
                            backgroundColor: $.map(stateRows, function (row, i) {
                                return stateColors[(row.state || "").toUpperCase()] || stateFallback[i % stateFallback.length];
                            }),
                            borderColor: "#1e1e1e",
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: pieOptions.plugins.legend,
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        var row = stateRows[context.dataIndex] || {};
                                        return " " + row.total;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        var genderRows = (dashboard && dashboard.genderDemographics) || [];
        var gender = genderRows[0];

        if ($("#genderChart").length) {
            if (genderChart) genderChart.destroy();
            genderChart = null;
            if (gender) {
                genderChart = new Chart($("#genderChart")[0], {
                    type: "pie",
                    data: {
                        labels: [
                            "Female " + percent(Number(gender.female_Percent) || 0),
                            "Male " + percent(Number(gender.male_Percent) || 0)
                        ],
                        datasets: [{
                            data: [gender.female, gender.male],
                            backgroundColor: ["#6fa8dc", "#2c8a9e"],
                            borderColor: "#1e1e1e",
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: pieOptions.plugins.legend,
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        var count = context.dataIndex === 0 ? gender.female : gender.male;
                                        var share = context.dataIndex === 0 ? gender.female_Percent : gender.male_Percent;
                                        return " " + count;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
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
        var rows = [];

        $.each(allSuppliers, function (i, row) {
            byName[row.supplier] = row;
        });

        $.each(names, function (i, name) {
            var row = byName[name] || {
                total_donation_amount: 0,
                total_donation_count: 0,
                donation_percent: 0
            };
            rows.push(row);
            labels.push(name === "QUINN" ? "QDF" : name);
            amounts.push(row.total_donation_amount);
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
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return percent(Number(rows[context.dataIndex].donation_percent) || 0);
                            },
                            afterLabel: function (context) {
                                var row = rows[context.dataIndex];
                                return [
                                    "Raised: " + money(row.total_donation_amount),
                                    "Donations: " + row.total_donation_count
                                ];
                            }
                        }
                    }
                }
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

    function fillFundraiserTable() {
        if (fundraiserTable) {
            fundraiserTable.destroy();
            fundraiserTable = null;
        }

        $("#fundraiserTable tbody").empty();

        $.each(dashboard.top10Fundraisers || [], function (i, row) {
            var name = row.supplier === "QUINN" ? "QDF" : row.supplier;
            name = name == "" ? "Unknown" : name;
            var actual_name = row.supplier == "" ? "Unknown" : row.supplier;
            var fr = (row.firstName || row.surname || "") + "[" + row.operatorNo + "]";

            $("#fundraiserTable tbody").append(
                "<tr>"
                + "<td>" + fr + "</td>"
                + "<td><span class='agency-badge badge-" + actual_name + "'>" + name + "</span></td>"
                + "<td class='num' data-order='" + row.total_Raised + "'>" + money(row.total_Raised) + "</td>"
                + "<td class='num' data-order='" + row.cc_dd_total + "'>" + money(row.cc_dd_total) + "</td>"
                + "<td class='num' data-order='" + row.so_total + "'>" + money(row.so_total) + "</td>"
                + "<td class='num' data-order='" + row.ho_total + "'>" + money(row.ho_total) + "</td>"
                + "</tr>"
            );
        });

        fundraiserTable = $("#fundraiserTable").DataTable({
            paging: true,
            pageLength: 10,
            lengthMenu: [[10, 20, 50, -1], [10, 20, 50, "All"]],
            searching: true,
            info: false,
            order: [[2, "desc"]],
            autoWidth: false,
            dom: "lBfrtp",
            buttons: [
                { extend: "copy", text: "Copy" },
                { extend: "csv", text: "CSV", title: "Fundraiser Performance" },
                { extend: "excel", text: "Excel", title: "Fundraiser Performance" }
            ]
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

            var declined_rate = row.declined_rate;
            var declined_count = row.declined_count;
        
            $("#clientTable tbody").append(
                "<tr>"
                + "<td>" + row.charity + "</td>"
                + "<td class='agency-badge badge-" + actual_name +"'>" + name + "</td>"
                + "<td>" + campaign + "</td>"
                + "<td data-order='" + row.total_donation_count + "'>" + row.total_donation_count + "</td>"
                + "<td data-order='" + row.total_donation_amount + "'>" + money(row.total_donation_amount) + "</td>"
                + "<td data-order='" + row.gift_avg + "'>" + money(row.gift_avg) + "</td>"
                + "<td class='neg' data-order='" + declined_rate + "'>" + percent(declined_rate) + " (" + declined_count + ")" + "</td>"
                + "</tr>"
            );
        });

        charityTable = $("#clientTable").DataTable({
            paging: true,
            pageLength: 10,
            lengthMenu: [[10, 20, 50, -1], [10, 20, 50, "All"]],
            searching: true,
            info: false,
            order: [[4, "desc"]],
            autoWidth: false,
            dom: "lBfrtp",
            buttons: [
                { extend: "copy", text: "Copy" },
                { extend: "csv", text: "CSV", title: "Charities" },
                { extend: "excel", text: "Excel", title: "Charities" }
            ]
        });
    }

    $(".viewtab").on("click", function () {
        if ($(this).data("view") !== "summary") return;
        $(".viewtab").removeClass("active");
        $(this).addClass("active");
        $("#summaryView").show();
        $("#clientView, #clientLoading").hide();

        is_summary_view = true;
        is_client_view = false;

        selectAllSummary();
        loadSummary();
    });

    function selectAllSummary() {
        $("#clientFilter, #supplierFilter, #campaignFilter").val(["ALL"]).trigger("multi:sync");
        supplier = "ALL";
        charity = "ALL";
        campaign = "ALL";
    }


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
        $("#clientLoadingMessage").html("Fetching data for<br><strong>Supplier:</strong> " + supplier + "<br><strong>Charities:</strong> " + charity + "<br><strong>Campaigns:</strong> " + campaign);

        clientTimer = setTimeout(function () {
            if (request !== clientRequest || !is_client_view) return;

            $.ajax({
                url: dashboardUrl,
                type: "GET",
                dataType: "json",
                data: { supplier: supplier, charity: charity, campaign: campaign, month: month }
            })
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
        $("#clientView").show();
        $("#clientDetail, #summaryView, #summaryLoading").hide();

        is_client_view = true;
        is_summary_view = false;

        $("#clientFilter, #supplierFilter, #campaignFilter").val(["ALL"]).trigger("multi:sync");
        $("#clientAgency").val(["ALL"]).trigger("change.select2");
        supplier = "ALL";
        charity = "ALL";
        campaign = "ALL";

        loadClientView();
    });

    $('#clientAgency').on("change", function () {
        supplier = ($(this).val() || ["ALL"]).join(",");
        loadClientView();
    });

    runClient = loadClientView;
});


