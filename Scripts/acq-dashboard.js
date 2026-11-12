function money(amount) {
    return "$" + Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function percent(value) {
    return value.toFixed(2) + "%";
}

function fillEngagement(summary) {
    if (!summary) return;

    function bar(labelId, barId, count, share) {
        var value = Number(share) || 0;
        $(labelId).text(count + " · " + percent(value));
        $(barId).css("width", value + "%");
        $(labelId).toggleClass("neg", value < 30);
    }

    bar("#mobileReach", "#mobileBar", summary.mobile, summary.mobile_perc);
    bar("#emailReach", "#emailBar", summary.email, summary.email_perc);
    bar("#dobReach", "#dobBar", summary.dob, summary.dob_perc);
}

function monthYearName(value) {
    var text = String(value || "").substring(0, 10);
    var month = parseInt(text.substring(5, 7), 10);
    var year = parseInt(text.substring(0, 4), 10);
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return names[month - 1] + " " + year;
}

var supplier = "ALL";
var charity = "ALL";
var campaign = "ALL";
var month = 0;
var runSummary = function () {};
var runRaisedChart = function () {};

var is_summary_view = false;
var is_compare_view = false;
var is_daily_view = true;
var runCompare = function () {};
var runDaily = function () {};

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
        else if (is_compare_view) runCompare();
        else if (is_daily_view) runDaily();
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
                    fillEngagement(dashboard.summary[0]);
    
                    $('#summaryLoading').hide();
                    $('#summaryView').show();
                    chartDemographics();

                });


            }, 1000);
    }

    function exportChartTable(canvasId, title, columns, rows, buttonOnly) {
        var id = canvasId + "Export";
        if (chartExportTables[id]) {
            chartExportTables[id].destroy();
            delete chartExportTables[id];
        }
        var table = $("#" + id);
        if (!table.length) {
            table = $("<table class='datatable chart-export' id='" + id + "'></table>");
            $("#" + canvasId).closest(".chart-wrap").after(table);
        }
        var head = "<thead><tr>" + columns.map(function (column) { return "<th>" + esc(column) + "</th>"; }).join("") + "</tr></thead>";
        var body = "<tbody>" + (rows || []).map(function (row) {
            return "<tr>" + row.map(function (cell) { return "<td>" + cell + "</td>"; }).join("") + "</tr>";
        }).join("") + "</tbody>";
        table.html(head + body);
        chartExportTables[id] = table.DataTable({
            paging: false,
            searching: false,
            info: false,
            ordering: false,
            autoWidth: false,
            dom: "Bt",
            buttons: [{ extend: "excel", text: "Excel", title: title }]
        });
        if (buttonOnly) table.closest(".dataTables_wrapper").addClass("chart-export-button-only");
    }

    function excelDayTable(selector, title, orderColumn) {
        if ($.fn.DataTable.isDataTable(selector)) $(selector).DataTable().destroy();
        var table = $(selector).DataTable({
            paging: true,
            pageLength: 10,
            lengthMenu: [[10, 20, 50, -1], [10, 20, 50, "All"]],
            searching: true,
            info: false,
            order: orderColumn == null ? [] : [[orderColumn, "desc"]],
            autoWidth: false,
            dom: "lBfrtp",
            buttons: [{ extend: "excel", text: "Excel", title: title }]
        });
        $(selector).css({ width: "max-content", minWidth: "100%" });
        return table;
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
            console.log(row);

            $("#fundraiserTable tbody").append(
                "<tr>"
                + "<td>" + fr + "</td>"
                + "<td><span class='agency-badge badge-" + actual_name + "'>" + name + "</span></td>"
                + "<td data-order='" + row.total_Donation + "'>" + row.total_Donation + "</td>"
                + "<td class='num' data-order='" + row.total_Raised + "'>" + money(row.total_Raised) + "</td>"
                + "<td class='num' data-order='" + row.cc_dd_total + "'>" + money(row.cc_dd_total) + "</td>"
                // + "<td class='num' data-order='" + row.cc_dd_total_count + "'>" + row.cc_dd_total_count + "</td>"
                // + "<td class='pos' data-order='" + row.so_total_p + "'>" + percent(row.so_total_p) + "</td>"
                + "<td class='num' data-order='" + row.so_total_p + "'>" + money(row.so_total_p) + "</td>"
                // + "<td class='num' data-order='" + row.so_total_count + "'>" + row.so_total_count + "</td>"
                + "<td class='num neg' data-order='" + row.decline_rate + "'>" + percent(row.decline_rate) + " (" + row.cc_dd_decline_count + ")" + "</td>"
                + "<td class='num orange' data-order='" + row.so_return_rate + "'>" + percent(row.so_return_rate) + "</td>"
                + "</tr>"
            );
        });  
        fundraiserTable = $("#fundraiserTable").DataTable({
            paging: true,
            pageLength: 10,
            lengthMenu: [[10, 20, 50, -1], [10, 20, 50, "All"]],
            searching: true,
            info: false,
            order: [[3, "desc"]],
            autoWidth: false,
            dom: "lBfrtp",
            buttons: [
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
            order: [[3, "desc"]],
            autoWidth: false,
            dom: "lBfrtp",
            buttons: [
                { extend: "excel", text: "Excel", title: "Campaign Performance" }
            ]
        });
    }

    $(".viewtab").on("click", function () {
        var view = $(this).data("view");
        $(".viewtab").removeClass("active");
        $(this).addClass("active");

        if (view === "compare") {
            $("#summaryView, #summaryLoading, #dailyView").hide();
            $("#compareView").show();
            $(".criteria").removeClass("is-daily").addClass("is-compare");
            $("body").removeClass("is-daily");
            is_summary_view = false;
            is_compare_view = true;
            is_daily_view = false;
            loadCompare();
            return;
        }

        if (view === "daily") {
            $("#summaryView, #summaryLoading, #compareView").hide();
            $("#dailyView").show();
            $(".criteria").removeClass("is-compare").addClass("is-daily");
            $("body").addClass("is-daily");
            is_summary_view = false;
            is_compare_view = false;
            is_daily_view = true;
            loadDaily();
            return;
        }

        $("#summaryView").show();
        $("#compareView, #dailyView").hide();
        $(".criteria").removeClass("is-compare is-daily");
        $("body").removeClass("is-daily");
        is_summary_view = true;
        is_compare_view = false;
        is_daily_view = false;
        selectAllSummary();
        loadSummary();
    });

    $(".compare-type").on("click", function () {
        $(".compare-type").removeClass("active");
        $(this).addClass("active");
        $(".criteria").toggleClass("is-custom", $(this).data("compare") === "custom");
    });

    var compareChart = null;
    var compareRateChart = null;
    var compareOperatorTable = null;
    var compareRequest = 0;
    var dailyRequest = 0;
    var dailyDrillRequest = 0;
    var dailyFundraiserTable = null;
    var dailyCampaignTable = null;
    var dailyCharityChart = null;
    var dailyRevenueChart = null;
    var dailyRevenueTable = null;
    var chartExportTables = {};

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function dayLabel(iso) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var text = String(iso || "");
        var month = parseInt(text.substring(5, 7), 10);
        var day = parseInt(text.substring(8, 10), 10);
        return day + " " + months[month - 1];
    }

    function monthBreaks(days) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var breaks = [];
        (days || []).forEach(function (day, index) {
            if (!index) return;
            var previous = String(days[index - 1].day || "");
            var current = String(day.day || "");
            if (previous.substring(0, 7) === current.substring(0, 7)) return;
            var month = parseInt(current.substring(5, 7), 10);
            breaks.push({ index: index, label: months[month - 1] || "" });
        });
        return breaks;
    }

    var monthLinePlugin = {
        id: "monthLine",
        afterDatasetsDraw: function (chart, args, options) {
            var breaks = (options && options.breaks) || [];
            if (!breaks.length) return;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data.length) return;
            var area = chart.chartArea;
            var ctx = chart.ctx;
            breaks.forEach(function (item) {
                var left = meta.data[item.index - 1];
                var right = meta.data[item.index];
                if (!left || !right) return;
                var x = (left.x + right.x) / 2;
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = "#f2f0ea";
                ctx.lineWidth = 1;
                ctx.moveTo(x, area.top);
                ctx.lineTo(x, area.bottom);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "#f2f0ea";
                ctx.font = "600 11px sans-serif";
                ctx.textBaseline = "top";
                var textWidth = ctx.measureText(item.label).width;
                var labelX = x + 6;
                ctx.textAlign = "left";
                if (labelX + textWidth > area.right - 4) {
                    labelX = x - 6;
                    ctx.textAlign = "right";
                }
                ctx.fillText(item.label, labelX, area.top + 2);
                ctx.restore();
            });
        }
    };

    function dayCell(donations, raised, extra) {
        var amount = Number(raised) || 0;
        var zero = !donations && !amount ? " is-zero" : "";
        var extraClass = extra ? " " + extra : "";
        return "<td class='num day-cell" + zero + extraClass + "' data-order='" + amount + "'><span class='stack'>" + donations + " - <small>" + money(amount) + "</small></span></td>";
    }

    function clearDailyDrill() {
        dailyDrillRequest++;
        if (dailyFundraiserTable) {
            dailyFundraiserTable.destroy();
            dailyFundraiserTable = null;
        }
        if (dailyCampaignTable) {
            dailyCampaignTable.destroy();
            dailyCampaignTable = null;
        }
        if (dailyCharityChart) {
            dailyCharityChart.destroy();
            dailyCharityChart = null;
        }
        $("#dailyTable tbody tr").removeClass("is-selected");
        $("#dailyDrill, #dailyDrillDetail, #dailyDrillLoading").hide();
    }

    function dailyShare(count, total) {
        if (!total) return "0.00%";
        return percent((count * 100) / total);
    }

    function dailyContact(count, donations, low) {
        var pct = donations ? (count * 100) / donations : 0;
        var tone = low && pct < 20 ? "dob-low" : "orange";
        return "<td class='" + tone + "'><span class='stack'>" + count + "<small>" + percent(pct) + "</small></span></td>";
    }

    function dailyCount(count, total, withShare) {
        if (!withShare) return "<td>" + count + "</td>";
        return "<td><span class='stack'>" + count + "<small>" + dailyShare(count, total) + "</small></span></td>";
    }

    function fillDailyTable(rows) {
        var body = $("#dailyTable tbody");
        body.empty();
        var total = {
            donations: 0, raised: 0, ccDdCount: 0, ccDdAmount: 0, soCount: 0, soAmount: 0,
            webCount: 0, webAmount: 0, tdCount: 0, tdAmount: 0, tier50: 0, tier100: 0, tier200: 0,
            mobile: 0, email: 0, dob: 0
        };

        $.each(rows, function (i, row) {
            total.donations += row.donations;
            total.raised += row.raised;
            total.ccDdCount += row.ccDdCount;
            total.ccDdAmount += row.ccDdAmount;
            total.soCount += row.soCount;
            total.soAmount += row.soAmount;
            total.webCount += row.webCount;
            total.webAmount += row.webAmount;
            total.tdCount += row.tdCount;
            total.tdAmount += row.tdAmount;
            total.tier50 += row.tier50;
            total.tier100 += row.tier100;
            total.tier200 += row.tier200;
            total.mobile += row.mobile;
            total.email += row.email;
            total.dob += row.dob;

            var mark = (row.campaigns && row.campaigns.length > 1) ? "*" : "";
            body.append(
                "<tr class='daily-charity-row' data-charity='" + esc(row.charity) + "'>"
                + "<td class='charity'>" + esc(row.charity) + mark + "</td>"
                + dailyFigures(row)
                + "</tr>"
                + dailyCampaignRows(row)
            );
        });

        body.append(
            "<tr class='grand'>"
            + "<td class='charity'>Grand Total</td>"
            + "<td class='teal'>" + total.donations + "</td>"
            + "<td class='teal'>" + money(total.raised) + "</td>"
            + dailyCount(total.ccDdCount, total.donations, true)
            + "<td>" + money(total.ccDdAmount) + "</td>"
            + dailyCount(total.soCount, total.donations, true)
            + "<td>" + money(total.soAmount) + "</td>"
            + dailyCount(total.webCount, total.donations, false)
            + "<td>" + money(total.webAmount) + "</td>"
            + "<td class='orange today'>" + total.tdCount + "</td>"
            + "<td class='orange today'>" + money(total.tdAmount) + "</td>"
            + dailyContact(total.mobile, total.donations, false)
            + dailyContact(total.email, total.donations, false)
            + dailyContact(total.dob, total.donations, true)
            + "<td class='blue'>" + total.tier50 + "</td>"
            + "<td class='blue'>" + total.tier100 + "</td>"
            + "<td class='green'>" + total.tier200 + "</td>"
            + "</tr>"
        );
    }

    function dailyFigures(row) {
        return "<td class='teal'>" + row.donations + "</td>"
            + "<td class='teal'>" + money(row.raised) + "</td>"
            + dailyCount(row.ccDdCount, row.donations, false)
            + "<td>" + money(row.ccDdAmount) + "</td>"
            + dailyCount(row.soCount, row.donations, false)
            + "<td>" + money(row.soAmount) + "</td>"
            + dailyCount(row.webCount, row.donations, false)
            + "<td>" + money(row.webAmount) + "</td>"
            + "<td class='orange today'>" + row.tdCount + "</td>"
            + "<td class='orange today'>" + money(row.tdAmount) + "</td>"
            + dailyContact(row.mobile, row.donations, false)
            + dailyContact(row.email, row.donations, false)
            + dailyContact(row.dob, row.donations, true)
            + "<td class='blue'>" + row.tier50 + "</td>"
            + "<td class='blue'>" + row.tier100 + "</td>"
            + "<td class='green'>" + row.tier200 + "</td>";
    }

    function dailyCampaignRows(row) {
        var campaigns = row.campaigns || [];
        if (campaigns.length <= 1) return "";
        return campaigns.map(function (item) {
            return "<tr class='daily-campaign-row' data-charity='" + esc(row.charity) + "' hidden>"
                + "<td class='charity'><span class='stack'>" + esc(item.name) + "<small>" + item.listNo + "</small></span></td>"
                + dailyFigures(item)
                + "</tr>";
        }).join("");
    }

    function drawMoneyChart(canvasId, chart, title, days) {
        if (chart) chart.destroy();
        var next = new Chart($("#" + canvasId)[0], {
            plugins: [monthLinePlugin],
            data: {
                labels: days.map(function (day) { return dayLabel(day.day); }),
                datasets: [
                    {
                        type: "bar",
                        label: "Raised",
                        data: days.map(function (day) { return day.raised; }),
                        backgroundColor: "#2c8a9e",
                        yAxisID: "y",
                        order: 2
                    },
                    {
                        type: "line",
                        label: "Donations",
                        data: days.map(function (day) { return day.donations; }),
                        borderColor: "#e8a33d",
                        backgroundColor: "#e8a33d",
                        tension: 0.3,
                        pointRadius: 3,
                        yAxisID: "y1",
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: "#9a9a93", boxWidth: 10 } },
                    monthLine: { breaks: monthBreaks(days) },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (context.dataset.label === "Raised") return "Raised: " + money(context.parsed.y);
                                return "Donations: " + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        position: "left",
                        grid: { color: "#2c2c2a" },
                        ticks: { color: "#9a9a93", callback: function (value) { return "$" + Number(value).toLocaleString(); } }
                    },
                    y1: {
                        position: "right",
                        grid: { display: false },
                        ticks: { color: "#9a9a93", precision: 0 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: "#9a9a93", maxRotation: 60, autoSkip: true, font: { size: 11 } }
                    }
                }
            }
        });
        exportChartTable(canvasId, title, ["Day", "Donations", "Raised"], days.map(function (day) {
            return [dayLabel(day.day), day.donations, money(day.raised)];
        }), true);
        return next;
    }

    function revenueTitle(rows) {
        var shown = {};
        (rows || []).forEach(function (row) {
            shown[String(row.charity || "").toUpperCase()] = true;
        });
        var labels = [];
        $("#clientFilter option:selected").each(function () {
            if (!this.value || this.value === "ALL") return;
            if (shown[String(this.value).toUpperCase()]) labels.push($(this).text());
        });
        return labels.length ? "ACQ Revenue Last 30 days - " + labels.join(", ") : "ACQ Revenue Last 30 days";
    }

    function drawDailyCharityChart(days, title) {
        dailyCharityChart = drawMoneyChart("dailyCharityChart", dailyCharityChart, title, days);
    }

    function drawDailyRevenueChart(days, rows) {
        var title = revenueTitle(rows);
        $("#dailyRevenueTitle").text(title);
        dailyRevenueChart = drawMoneyChart("dailyRevenueChart", dailyRevenueChart, title, days);
        if (dailyRevenueTable) {
            dailyRevenueTable.destroy();
            dailyRevenueTable = null;
        }
        var revenueRows = (days || []).map(function (day) {
            return { name: "ACQ Revenue", day: day.day, donations: day.donations, raised: day.raised };
        });
        renderDayGrid("#dailyRevenueDays", "ACQ Revenue", revenueRows, days, false, true);
    }

    function showRevenueTable() {
        if ($.fn.DataTable.isDataTable("#dailyRevenueDays")) {
            $("#dailyRevenueDays").DataTable().columns.adjust();
            return;
        }
        if (!$("#dailyRevenueDays tbody tr").length) return;
        dailyRevenueTable = excelDayTable("#dailyRevenueDays", $("#dailyRevenueTitle").text(), 1);
    }

    function renderDayGrid(selector, nameHeading, rows, days, withSupplier, withMonthTotal) {
        var grouped = {};
        (rows || []).forEach(function (row) {
            if (!grouped[row.name]) grouped[row.name] = { name: row.name, supplier: row.supplier || "", days: {}, donations: 0, raised: 0 };
            grouped[row.name].days[row.day] = row;
            grouped[row.name].donations += row.donations;
            grouped[row.name].raised += Number(row.raised) || 0;
        });

        var names = Object.keys(grouped).sort(function (a, b) {
            return grouped[b].raised - grouped[a].raised;
        });
        var monthAt = {};
        monthBreaks(days).forEach(function (item) { monthAt[item.index] = item.label; });
        var monthColumns = withMonthTotal ? 1 : 0;
        if (withMonthTotal) {
            days.forEach(function (day, index) { if (monthAt[index]) monthColumns++; });
        }
        var head = "<tr><th>" + nameHeading + "</th>";
        if (withSupplier) head += "<th>Supplier</th>";
        head += "<th class='num total'>" + (withMonthTotal ? "Grand Total" : "Total") + "</th>";
        days.forEach(function (day, index) {
            var month = monthAt[index];
            if (withMonthTotal && (!index || month)) head += monthTotalHead(month || monthLabel(day.day), !!month);
            var mark = month && !withMonthTotal;
            head += "<th class='num" + (mark ? " month-start" : "") + "'>" + (mark ? "<span class='month-mark'>" + esc(month) + "</span>" : "") + dayLabel(day.day) + "</th>";
        });
        head += "</tr>";

        var body = "";
        if (!names.length) {
            body = "<tr><td colspan='" + (days.length + monthColumns + (withSupplier ? 3 : 2)) + "'>No donations from today back through the same day last month.</td></tr>";
        }
        names.forEach(function (name) {
            var item = grouped[name];
            var byMonth = monthSums(item, days);
            body += "<tr><td>" + esc(item.name) + "</td>";
            if (withSupplier) {
                var label = item.supplier === "QUINN" ? "QDF" : (item.supplier || "Unknown");
                var badge = item.supplier || "Unknown";
                body += "<td><span class='agency-badge badge-" + esc(badge) + "'>" + esc(label) + "</span></td>";
            }
            body += dayCell(item.donations, item.raised, "total");
            days.forEach(function (day, index) {
                var month = monthAt[index];
                if (withMonthTotal && (!index || month)) {
                    var sum = byMonth[String(day.day).substring(0, 7)] || { donations: 0, raised: 0 };
                    body += dayCell(sum.donations, sum.raised, "total month-total" + (month ? " month-start" : ""));
                }
                var cell = item.days[day.day];
                body += dayCell(cell ? cell.donations : 0, cell ? cell.raised : 0, month && !withMonthTotal ? "month-start" : "");
            });
            body += "</tr>";
        });
        $(selector).html("<thead>" + head + "</thead><tbody>" + body + "</tbody>");
    }

    function monthLabel(iso) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var month = parseInt(String(iso || "").substring(5, 7), 10);
        return months[month - 1] || "";
    }

    function monthTotalHead(label, breakBefore) {
        return "<th class='num total month-total" + (breakBefore ? " month-start" : "") + "'><span class='month-mark'>" + esc(label) + "</span>Total</th>";
    }

    function monthSums(item, days) {
        var totals = {};
        (days || []).forEach(function (day) {
            var key = String(day.day).substring(0, 7);
            if (!totals[key]) totals[key] = { donations: 0, raised: 0 };
            var cell = item.days[day.day];
            if (!cell) return;
            totals[key].donations += cell.donations;
            totals[key].raised += Number(cell.raised) || 0;
        });
        return totals;
    }

    function loadDailyDrill(charityName) {
        var request = ++dailyDrillRequest;
        if (dailyFundraiserTable) {
            dailyFundraiserTable.destroy();
            dailyFundraiserTable = null;
        }
        if (dailyCampaignTable) {
            dailyCampaignTable.destroy();
            dailyCampaignTable = null;
        }
        $("#dailyDrillDetail").hide();
        $("#dailyRevenue").hide();
        $("#dailyDrill").show();
        $("#dailyDrillLoading").show();
        $("#dailyDrillMessage").text("Loading each day from today back through the same day last month for " + charityName + "…");
        var drill = document.getElementById("dailyDrill");
        if (drill && drill.scrollIntoView) drill.scrollIntoView({ behavior: "smooth", block: "start" });

        $.ajax({
            url: dailyDetailUrl,
            dataType: "json",
            data: { supplier: supplier, charity: charityName, campaign: campaign }
        }).done(function (data) {
            if (request !== dailyDrillRequest || !is_daily_view) return;
            var days = data.days || [];
            var charityTitle = "Fund Raised by Charity Last 30 days — " + charityName;
            var campaignTitle = "Campaign Performance Last 30 days — " + charityName;
            var fundraiserTitle = "Fundraiser Performance Last 30 days — " + charityName;
            $("#dailyCharityTitle").text(charityTitle);
            $("#dailyCampaignTitle").text(campaignTitle);
            $("#dailyFundraiserTitle").text(fundraiserTitle);
            renderDayGrid("#dailyCampaignDays", "Campaign", data.campaigns, days, false);
            renderDayGrid("#dailyFundraiserDays", "Operator", data.fundraisers, days, true);
            $("#dailyDrillLoading").hide();
            $("#dailyDrillDetail").show();
            dailyCampaignTable = excelDayTable("#dailyCampaignDays", campaignTitle, 1);
            if ((data.fundraisers || []).length) {
                dailyFundraiserTable = excelDayTable("#dailyFundraiserDays", fundraiserTitle, 2);
            }
            drawDailyCharityChart(days, charityTitle);
        }).fail(function () {
            if (request !== dailyDrillRequest || !is_daily_view) return;
            $("#dailyDrillLoading").hide();
            $("#dailyDrillMessage").text("The daily totals for " + charityName + " could not be loaded.");
            $("#dailyDrillLoading").show();
        });
    }

    $("#dailyTable").on("click", "tbody tr.daily-charity-row", function () {
        var picked = $(this).attr("data-charity");
        var campaignRows = $(this).nextUntil("tr.daily-charity-row, tr.grand");
        var wasOpen = $(this).hasClass("is-selected");
        $("#dailyTable tbody tr.daily-charity-row").removeClass("is-selected");
        $("#dailyTable tbody tr.daily-campaign-row").attr("hidden", "hidden");
        if (wasOpen) {
            $("#dailyDrill, #dailyDrillDetail, #dailyDrillLoading").hide();
            if (dailyRevenueChart) {
                $("#dailyRevenue").show();
                dailyRevenueChart.resize();
            }
            return;
        }
        $(this).addClass("is-selected");
        campaignRows.removeAttr("hidden");
        loadDailyDrill(picked);
    });

    $("#dailyRevenueView").on("click", ".daily-range-btn", function () {
        if ($(this).hasClass("active")) return;
        $("#dailyRevenueView .daily-range-btn").removeClass("active");
        $(this).addClass("active");
        var tableMode = String($(this).data("revenueView")) === "table";
        $("#dailyRevenue").toggleClass("is-table", tableMode);
        if (tableMode) showRevenueTable();
        else if (dailyRevenueChart) dailyRevenueChart.resize();
    });

    $(".daily-range-bar .daily-range-btn").on("click", function () {
        if ($(this).hasClass("active")) return;
        $(".daily-range-bar .daily-range-btn").removeClass("active");
        $(this).addClass("active");
        var wide = String($(this).data("range")) === "30";
        $("#dailySummaryTitle").text(wide ? "Current day to last month" : "Current Month ACQ Summary");
        if (is_daily_view) loadDaily();
    });

    function loadDaily() {
        var request = ++dailyRequest;
        clearDailyDrill();
        if (dailyRevenueChart) {
            dailyRevenueChart.destroy();
            dailyRevenueChart = null;
        }
        $("#dailyEmpty, #dailyDetail, #dailyRevenue").hide();
        $("#dailyLoading").show();
        $("#dailyLoadingMessage").html("Fetching data for<br><strong>Supplier:</strong> " + supplier + "<br><strong>Charities:</strong> " + charity + "<br><strong>Campaigns:</strong> " + campaign);

        $.ajax({
            url: dailyUrl,
            data: { supplier: supplier, charity: charity, campaign: campaign, range: String($(".daily-range-bar .daily-range-btn.active").data("range") || "month") }
        }).done(function (data) {
            if (request !== dailyRequest || !is_daily_view) return;
            $("#dailyLoading").hide();
            if (data) fillSummaryFilters(data);
            var rows = data && data.charities ? data.charities : [];
            var days = data && data.days ? data.days : [];
            if (!rows.length) {
                $("#dailyEmpty").show();
            } else {
                fillDailyTable(rows);
                $("#dailyDetail").show();
                if (days.length) {
                    drawDailyRevenueChart(days, rows);
                    $("#dailyRevenue").show();
                    if ($("#dailyRevenue").hasClass("is-table")) showRevenueTable();
                }
            }
        }).fail(function () {
            if (request !== dailyRequest || !is_daily_view) return;
            $("#dailyLoading").hide();
            $("#dailyEmpty").text("The daily summary could not be loaded.").show();
        });
    }

    function loadCompare() {
        var request = ++compareRequest;
        var compareType = $(".compare-type.active").data("compare") || "month";
        var from = $("#compareFrom").val();
        var to = $("#compareTo").val();

        if (compareType === "custom" && (!from || !to || to < from)) {
            $("#compareLoading, #compareDetail").hide();
            $("#compareEmpty").text("Choose a from month and a to month, then Apply.").show();
            return;
        }

        $("#compareEmpty, #compareDetail").hide();
        $("#compareLoading").show();
        $("#compareLoadingMessage").text("Comparing periods…");

        $.ajax({
            url: compareUrl,
            type: "GET",
            dataType: "json",
            data: { supplier: supplier, charity: charity, campaign: campaign, compareType: compareType, from: from, to: to }
        })
        .done(function (data) {
            if (request !== compareRequest || !is_compare_view) return;
            $("#compareLoading").hide();
            if (!data.periods || !data.periods.length) {
                $("#compareDetail").hide();
                $("#compareEmpty").text(data.message || "No comparison for this range.").show();
                return;
            }

            $("#compareEmpty").hide();
            renderCompare(data);
            $("#compareDetail").show();
        })
        .fail(function () {
            if (request !== compareRequest || !is_compare_view) return;
            $("#compareLoading, #compareDetail").hide();
            $("#compareEmpty").text("Comparison could not be loaded.").show();
        });
    }

    function renderCompare(data) {
        var periods = data.periods;
        var current = periods[periods.length - 1];
        var previous = periods.length > 1 ? periods[periods.length - 2] : null;

        $("#cmpRaised").text(money(current.raised));
        $("#cmpDonations").text(current.donations);
        $("#cmpAvgGift").text(money(current.avgGift));
        $("#cmpDeclined").text(percent(current.declinedRate));
        $("#cmpSoReturn").text(current.soReturn == null ? "—" : percent(current.soReturn));

        setDelta("#cmpRaisedDelta", previous && signedMoney(current.raised, previous.raised), previous && current.raised - previous.raised);
        setDelta("#cmpDonationsDelta", previous && signedCount(current.donations, previous.donations), previous && current.donations - previous.donations);
        setDelta("#cmpAvgGiftDelta", previous && signedMoney(current.avgGift, previous.avgGift), previous && current.avgGift - previous.avgGift);
        setDelta("#cmpDeclinedDelta", previous && signedPoints(current.declinedRate, previous.declinedRate), previous && previous.declinedRate - current.declinedRate);
        setDelta("#cmpSoReturnDelta", previous && signedPoints(current.soReturn, previous.soReturn), previous && current.soReturn != null && previous.soReturn != null && current.soReturn - previous.soReturn);

        drawCompareChart(periods);
        drawCompareRateChart(periods);
        fillCompareOperatorTable(data.byOperator || [], periods);
        fillCompareTable("#compareClientTable", "Client", data.byClient || [], periods);
        fillCompareTable("#compareSupplierTable", "Supplier", data.bySupplier || [], periods);
    }

    function setDelta(selector, text, direction) {
        var el = $(selector);
        el.removeClass("pos neg").text(text || "");
        if (!text || !direction) return;
        el.addClass(direction > 0 ? "pos" : "neg");
    }

    function signedCount(current, previous) {
        if (previous == null) return "";
        return signedAmount(current - previous, false) + changeShare(current, previous);
    }

    function signedPoints(current, previous) {
        if (current == null || previous == null) return "";
        var diff = Number(current) - Number(previous);
        var body = Math.abs(diff).toFixed(2) + "%";
        if (diff > 0) return "+" + body;
        if (diff < 0) return "-" + body;
        return body;
    }

    function signedMoney(current, previous) {
        if (previous == null) return "";
        return signedAmount(current - previous, true) + changeShare(current, previous);
    }

    function signedAmount(diff, asMoney) {
        var body = asMoney ? money(Math.abs(diff)) : String(Math.abs(diff));
        if (diff > 0) return "+" + body;
        if (diff < 0) return "-" + body;
        return body;
    }

    function changeShare(current, previous) {
        if (!previous) return "";
        var pct = ((current - previous) / previous) * 100;
        var sign = pct > 0 ? "+" : "";
        return " · " + sign + pct.toFixed(1) + "%";
    }

    function drawCompareChart(periods) {
        if (compareChart) compareChart.destroy();
        compareChart = new Chart($("#compareChart")[0], {
            data: {
                labels: periods.map(function (period) { return period.label; }),
                datasets: [
                    {
                        type: "bar",
                        label: "Raised",
                        data: periods.map(function (period) { return period.raised; }),
                        backgroundColor: "#2c8a9e",
                        yAxisID: "y",
                        order: 2
                    },
                    {
                        type: "line",
                        label: "Donations",
                        data: periods.map(function (period) { return period.donations; }),
                        borderColor: "#e8a33d",
                        backgroundColor: "#e8a33d",
                        tension: 0.3,
                        pointRadius: 4,
                        yAxisID: "y1",
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: "#9a9a93", boxWidth: 10 } }
                },
                scales: {
                    y: {
                        position: "left",
                        grid: { color: "#2c2c2a" },
                        ticks: { color: "#9a9a93", callback: function (value) { return "$" + Number(value).toLocaleString(); } }
                    },
                    y1: {
                        position: "right",
                        grid: { display: false },
                        ticks: { color: "#9a9a93" }
                    },
                    x: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    function drawCompareRateChart(periods) {
        if (compareRateChart) compareRateChart.destroy();
        compareRateChart = new Chart($("#compareRateChart")[0], {
            data: {
                labels: periods.map(function (period) { return period.label; }),
                datasets: [
                    {
                        type: "line",
                        label: "Avg. gift",
                        data: periods.map(function (period) { return period.avgGift; }),
                        borderColor: "#2c8a9e",
                        backgroundColor: "#2c8a9e",
                        tension: 0.3,
                        pointRadius: 4,
                        yAxisID: "y"
                    },
                    {
                        type: "line",
                        label: "SO return %",
                        data: periods.map(function (period) { return period.soReturn; }),
                        borderColor: "#e8a33d",
                        backgroundColor: "#e8a33d",
                        tension: 0.3,
                        pointRadius: 4,
                        spanGaps: false,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: "#9a9a93", boxWidth: 10 } }
                },
                scales: {
                    y: {
                        position: "left",
                        grid: { color: "#2c2c2a" },
                        ticks: { color: "#9a9a93", callback: function (value) { return "$" + Number(value).toLocaleString(); } }
                    },
                    y1: {
                        position: "right",
                        grid: { display: false },
                        ticks: { color: "#9a9a93", callback: function (value) { return value + "%"; } }
                    },
                    x: { grid: { display: false }, ticks: { color: "#9a9a93" } }
                }
            }
        });
    }

    function fillCompareOperatorTable(operators, periods) {
        if (compareOperatorTable) {
            compareOperatorTable.destroy();
            compareOperatorTable = null;
        }

        var grouped = {};
        var names = [];
        (operators || []).forEach(function (row) {
            var key = String(row.name || "").trim() || "Unknown";
            if (!grouped[key]) {
                grouped[key] = { supplier: row.supplier || "", months: {} };
                names.push(key);
            }
            if (row.supplier) grouped[key].supplier = row.supplier;
            grouped[key].months[row.label] = row;
        });

        var lastLabel = periods[periods.length - 1].label;
        var prevLabel = periods.length > 1 ? periods[periods.length - 2].label : null;
        names.sort(function (a, b) {
            var av = grouped[a].months[lastLabel] ? Number(grouped[a].months[lastLabel].raised) : 0;
            var bv = grouped[b].months[lastLabel] ? Number(grouped[b].months[lastLabel].raised) : 0;
            return bv - av;
        });

        var head = "<tr><th>Operator</th><th>Supplier</th>";
        periods.forEach(function (period) {
            head += "<th class='num'>" + period.label + "</th>";
        });
        head += "<th class='num'>Change</th></tr>";

        var body = "";
        names.forEach(function (name) {
            var info = grouped[name];
            var supplier = info.supplier || "";
            var supplierName = supplier === "QUINN" ? "QDF" : (supplier || "Unknown");
            var badge = supplier || "Unknown";
            body += "<tr><td>" + name + "</td>"
                + "<td><span class='agency-badge badge-" + badge + "'>" + supplierName + "</span></td>";
            periods.forEach(function (period) {
                var amount = info.months[period.label] ? Number(info.months[period.label].raised) : 0;
                body += "<td class='num' data-order='" + amount + "'>" + money(amount) + "</td>";
            });
            var current = info.months[lastLabel] ? Number(info.months[lastLabel].raised) : 0;
            var previous = prevLabel && info.months[prevLabel] ? Number(info.months[prevLabel].raised) : 0;
            var diff = prevLabel ? current - previous : 0;
            var changeClass = diff > 0 ? "pos" : diff < 0 ? "neg" : "";
            body += "<td class='num " + changeClass + "' data-order='" + diff + "'>" + (prevLabel ? signedMoney(current, previous) : "") + "</td></tr>";
        });

        $("#compareOperatorTable").html("<thead>" + head + "</thead><tbody>" + body + "</tbody>");
        compareOperatorTable = $("#compareOperatorTable").DataTable({
            paging: true,
            pageLength: 10,
            lengthMenu: [[10, 20, 50, -1], [10, 20, 50, "All"]],
            searching: true,
            info: false,
            order: [[1 + periods.length, "desc"]],
            autoWidth: false,
            dom: "lfrtp"
        });
    }

    function fillCompareTable(selector, nameHeading, rows, periods) {
        var grouped = {};
        var names = [];
        rows.forEach(function (row) {
            if (!grouped[row.name]) {
                grouped[row.name] = {};
                names.push(row.name);
            }
            grouped[row.name][row.label] = row;
        });

        var lastLabel = periods[periods.length - 1].label;
        var prevLabel = periods.length > 1 ? periods[periods.length - 2].label : null;
        names.sort(function (a, b) {
            var av = grouped[a][lastLabel] ? Number(grouped[a][lastLabel].raised) : 0;
            var bv = grouped[b][lastLabel] ? Number(grouped[b][lastLabel].raised) : 0;
            return bv - av;
        });

        var head = "<tr><th>" + nameHeading + "</th>";
        periods.forEach(function (period) {
            head += "<th class='num'>" + period.label + "</th>";
        });
        head += "<th class='num'>Change</th></tr>";

        var body = "";
        names.forEach(function (name) {
            var display = name === "QUINN" ? "QDF" : (name || "Unknown");
            body += "<tr><td>" + display + "</td>";
            periods.forEach(function (period) {
                var amount = grouped[name][period.label] ? grouped[name][period.label].raised : 0;
                body += "<td class='num'>" + money(amount) + "</td>";
            });
            var current = grouped[name][lastLabel] ? Number(grouped[name][lastLabel].raised) : 0;
            var previous = prevLabel && grouped[name][prevLabel] ? Number(grouped[name][prevLabel].raised) : 0;
            var diff = current - (prevLabel ? previous : current);
            var cls = diff > 0 ? "pos" : diff < 0 ? "neg" : "";
            body += "<td class='num " + cls + "'>" + (prevLabel ? signedMoney(current, previous) : "") + "</td></tr>";
        });

        $(selector).html("<thead>" + head + "</thead><tbody>" + body + "</tbody>");
    }

    runCompare = loadCompare;
    runDaily = loadDaily;

    function selectAllSummary() {
        $("#clientFilter, #supplierFilter, #campaignFilter").val(["ALL"]).trigger("multi:sync");
        supplier = "ALL";
        charity = "ALL";
        campaign = "ALL";
    }


    selectAgencyPills();
    selectAllSummary();
    loadDaily();
    runSummary = loadSummary;
    runRaisedChart = chartRaisedByCharity;
});
