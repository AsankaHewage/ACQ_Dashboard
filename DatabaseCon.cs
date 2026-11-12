using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Globalization;
using System.Threading.Tasks;
using ACQFundraisingDashboard.Models;

namespace ACQFundraisingDashboard
{
    // Runs dbo.ACQFundraisingDashboard and maps its five result sets.
    public static class DatabaseCon
    {
        // Summary for every charity and every supplier.
        public static DashboardData GetDashboard()
        {
            return GetDashboard("ALL", "ALL", "ALL", 0);
        }

        // Summary for one supplier and one charity. Blank values are sent as ALL.
        public static DashboardData GetDashboard(string supplier = "ALL", string charity = "ALL", string campaign = "ALL", int months = 0)
        {
            var firstOfThisMonth = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            DateTime start;
            DateTime end;

            // 0 and 1 are one calendar month. 3, 6, and 12 run through the end of last month.
            if (months <= 1)
            {
                start = firstOfThisMonth.AddMonths(-Math.Max(months, 0));
                end = start.AddMonths(1).AddDays(-1);
            }
            else
            {
                start = firstOfThisMonth.AddMonths(-months);
                end = firstOfThisMonth.AddDays(-1);
            }


            return GetDashboard(
                start,
                end,
                string.IsNullOrWhiteSpace(charity) ? "ALL" : charity,
                string.IsNullOrWhiteSpace(supplier) ? "ALL" : supplier,
                string.IsNullOrWhiteSpace(campaign) ? "ALL" : campaign);
        }

        // Calls the procedure and reads the result sets in order.
        public static DashboardData GetDashboard(DateTime startDate, DateTime endDate, string charity, string supplier, string campaign)
        {
            var data = new DashboardData();
            var connectionString = ConfigurationManager.ConnectionStrings["ACQFundraising_staging"].ConnectionString;

            using (var connection = new SqlConnection(connectionString))

            using (var command = new SqlCommand("dbo.ACQFundraisingDashboard", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = 120;
                // command.Parameters.Add("@startdate", SqlDbType.Date).Value = startDate.Date;
                // command.Parameters.Add("@endtdate", SqlDbType.Date).Value = endDate.Date;
                // command.Parameters.Add("@charity", SqlDbType.VarChar, 50).Value = charity ?? "ALL";
                // command.Parameters.Add("@supplier", SqlDbType.VarChar, 50).Value = supplier ?? "ALL";

                command.Parameters.AddWithValue("@startdate", startDate.Date);
                command.Parameters.AddWithValue("@endtdate", endDate.Date);
                command.Parameters.AddWithValue("@charity", charity ?? "ALL");
                command.Parameters.AddWithValue("@supplier", supplier ?? "ALL");
                command.Parameters.AddWithValue("@campaign", campaign ?? "ALL");


                connection.Open();


                data.DatePicker.Add(new DatePickerRange
                {
                    start_date = startDate.Date,
                    end_date = endDate.Date
                });


                using (var reader = command.ExecuteReader())
                {
                    // 0 Summary: one totals row for the KPIs and client view.
                    while (reader.Read())
                    {
                        data.Summary.Add(new DashboardSummary
                        {
                            Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                            Total_donation_count = ReadInt(reader, "Total_donation_count"),
                            Client_count = ReadInt(reader, "Client_count"), //client shown
                            Avg_gift = ReadDecimal(reader, "Avg_gift"),
                            Total_declined_count = ReadInt(reader, "Total_declined_count"),
                            Total_declined_rate = ReadDecimal(reader, "Total_declined_rate"),
                            cc_total = ReadDecimal(reader, "cc_total"),
                            cc_donations = ReadInt(reader, "cc_donations"),
                            dd_total = ReadDecimal(reader, "dd_total"),
                            dd_donations = ReadInt(reader, "dd_donations"),
                            cc_dd_total = ReadDecimal(reader, "cc_dd_total"),
                            cc_dd_donations = ReadInt(reader, "cc_dd_donations"),
                            so_total = ReadDecimal(reader, "so_total"),
                            so_donations = ReadInt(reader, "so_donations"),
                            //td_total = ReadDecimal(reader, "td_total"),
                            //td_donations = ReadInt(reader, "td_donations"),
                            ho_total = ReadDecimal(reader, "ho_total"),//web 
                            ho_donations = ReadInt(reader, "ho_donations"),//web
                            today_total = ReadDecimal(reader, "today_total"),
                            today_donations = ReadInt(reader, "today_donations"),
                            tier50less = ReadInt(reader, "tier50less"),
                            tier50 = ReadInt(reader, "tier50"),
                            tier100 = ReadInt(reader, "tier100"),
                            tier200 = ReadInt(reader, "tier200"),
                            mobile = ReadInt(reader, "mobile"),
                            mobile_perc = ReadDecimal(reader, "mobile_perc"),
                            email = ReadInt(reader, "email"),
                            email_perc = ReadDecimal(reader, "email_perc"),
                            dob = ReadInt(reader, "dob"),
                            dob_perc = ReadDecimal(reader, "dob_perc"),
                            L1date = ReadDateTime(reader, "L1date"),
                            L1p = ReadDecimal(reader, "L1p"),
                            L1r = ReadDecimal(reader, "L1r"),
                            L1p_L1r_perc = ReadDecimal(reader, "L1p_L1r_perc"),
                            L2date = ReadDateTime(reader, "L2date"),
                            L2p = ReadDecimal(reader, "L2p"),
                            L2r = ReadDecimal(reader, "L2r"),
                            L2p_L2r_perc = ReadDecimal(reader, "L2p_L2r_perc"),
                            L3date = ReadDateTime(reader, "L3date"),
                            L3p = ReadDecimal(reader, "L3p"),
                            L3r = ReadDecimal(reader, "L3r"),
                            L3p_L3r_perc = ReadDecimal(reader, "L3p_L3r_perc"),
                            L4date = ReadDateTime(reader, "L4date"),
                            L4p = ReadDecimal(reader, "L4p"),
                            L4r = ReadDecimal(reader, "L4r"),
                            L4p_L4r_perc = ReadDecimal(reader, "L4p_L4r_perc"),
                            L5date = ReadDateTime(reader, "L5date"),
                            L5p = ReadDecimal(reader, "L5p"),
                            L5r = ReadDecimal(reader, "L5r"),
                            L5p_L5r_perc = ReadDecimal(reader, "L5p_L5r_perc"),
                            L6date = ReadDateTime(reader, "L6date"),
                            L6p = ReadDecimal(reader, "L6p"),
                            L6r = ReadDecimal(reader, "L6r"),
                            L6p_L6r_perc = ReadDecimal(reader, "L6p_L6r_perc"),
                            L7date = ReadDateTime(reader, "L7date"),
                            L7p = ReadDecimal(reader, "L7p"),
                            L7r = ReadDecimal(reader, "L7r"),
                            L7p_L7r_perc = ReadDecimal(reader, "L7p_L7r_perc"),
                            C1date = ReadDateTime(reader, "C1date"),
                            C1p = ReadDecimal(reader, "C1p"),
                            C1r = ReadDecimal(reader, "C1r"),
                            C1p_C1r_perc = ReadDecimal(reader, "C1p_C1r_perc"),

                        });
                    }

                    reader.NextResult();
                    // 1 RaisedByCharity: one bar per charity.
                    while (reader.Read())
                    {
                        data.RaisedByCharity.Add(new RaisedByCharity
                        {
                            //Supplier = ReadString(reader, "Supplier"),
                            Charity = ReadString(reader, "Charity"),
                            Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                            Total_donation_count = ReadDecimal(reader, "Total_donation_count")
                        });
                    }

                    reader.NextResult();
                    // 2 RaisedByCharityList: one clients-table row per charity and campaign.
                    while (reader.Read())
                    {
                        data.RaisedByCharityList.Add(new RaisedByCharityList
                        {
                            Supplier = ReadString(reader, "Supplier"),
                            Charity = ReadString(reader, "Charity"),
                            ListNo = ReadInt(reader, "ListNo"),
                            BankingProductType = ReadString(reader, "BankingProductType"),
                            Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                            Total_donation_count = ReadInt(reader, "Total_donation_count"),
                            Gift_avg = ReadDecimal(reader, "Gift_avg"),
                            Declined_count = ReadInt(reader, "Declined_count"),
                            Declined_rate = ReadDecimal(reader, "Declined_rate"),
                        });
                    }

                    reader.NextResult();
                    // 3 RaisedBySupplier: Supplier donut. A filtered call returns only that supplier.
                    while (reader.Read())
                    {
                        data.RaisedBySupplier.Add(new RaisedBySupplier
                        {
                            Supplier = ReadString(reader, "Supplier"),
                            Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                            Total_donation_count = ReadInt(reader, "Total_donation_count"),
                            Donation_percent = ReadDecimal(reader, "Donation_percent")
                        });
                    }

                    reader.NextResult();
                    // 4 RaisedByCampaign: campaign donut.
                    while (reader.Read())
                    {
                        data.RaisedByCampaign.Add(new RaisedByCampaign
                        {
                            ListNo = ReadInt(reader, "ListNo"),
                            BankingProductType = ReadString(reader, "BankingProductType"),
                            Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                            Total_donation_count = ReadInt(reader, "Total_donation_count")
                        });
                    }

                    reader.NextResult();
                    // 5 ClientShown
                    while (reader.Read())
                    {
                        data.ClientShown.Add(new ClientShown
                        {
                            Charity = ReadString(reader, "Charity"),
                            //ListNo = ReadInt(reader, "ListNo"),
                            //BankingProductType = ReadString(reader, "BankingProductType")
                        });
                    }

                    reader.NextResult();
                    // 6 AllSuppliers
                    while (reader.Read())
                    {
                        data.AllSuppliers.Add(new AllSuppliers
                        {
                            Supplier = ReadString(reader, "Supplier")
                        });
                    }

                    reader.NextResult();
                    // 7 AllCharities
                    while (reader.Read())
                    {
                        data.AllCharities.Add(new AllCharities
                        {
                            Charity = ReadString(reader, "Charity")
                        });
                    }

                    reader.NextResult();
                    // 8 AllCampaigns
                    while (reader.Read())
                    {
                        data.AllCampaigns.Add(new AllCampaigns
                        {
                            ListNo = ReadInt(reader, "ListNo"),
                            BankingProductType = ReadString(reader, "BankingProductType")
                        });
                    }

                    reader.NextResult();
                    // 9 Top10Fundraisers
                    while (reader.Read())
                    {
                        data.Top10Fundraisers.Add(new Top10Fundraisers
                        {
                            OperatorNo = ReadInt(reader, "OperatorNo"),
                            Supplier = ReadString(reader, "Supplier"),
                            Surname = ReadString(reader, "Surname"),
                            FirstName = ReadString(reader, "FirstName"),
                            Total_Raised = ReadDecimal(reader, "Total_Raised"),
                            Total_Donation = ReadInt(reader, "Total_Donation"),
                            cc_dd_total = ReadDecimal(reader, "cc_dd_total"),
                            cc_dd_total_count = ReadInt(reader, "cc_dd_total_count"),
                            so_total_p = ReadDecimal(reader, "so_total_p"),
                            so_total_r = ReadDecimal(reader, "so_total_r"),
                            so_total_r_count = ReadInt(reader, "so_total_r_count"),
                            so_total_count = ReadInt(reader, "so_total_count"),
                            cc_dd_decline_count = ReadInt(reader, "cc_dd_decline_count"),
                            decline_rate = ReadDecimal(reader, "decline_rate"),
                            so_return_rate = ReadDecimal(reader, "so_return_rate"),
                        });
                    }

                    reader.NextResult();
                    // 10 StateDemographics
                    while (reader.Read())
                    {
                        data.StateDemographics.Add(new StateDemographics
                        {
                            State = ReadString(reader, "State"),
                            Total = ReadInt(reader, "Total"),
                            Percentage = ReadDecimal(reader, "Percentage")
                        });
                    }

                    reader.NextResult();
                    // 11 GenderDemographics
                    while (reader.Read())
                    {
                        data.GenderDemographics.Add(new GenderDemographics
                        {
                            Male = ReadInt(reader, "Male"),
                            Female = ReadInt(reader, "Female"),
                            Male_Percent = ReadDecimal(reader, "Male_Percent"),
                            Female_Percent = ReadDecimal(reader, "Female_Percent"),
                        });
                    }

                    // Daily sets, then Charity_Summary_Table and Total_raised_donation_daily. Absent sets are skipped.
                    while (reader.NextResult())
                    {
                        if (HasColumn(reader, "PledgeDate") && HasColumn(reader, "Charity"))
                        {
                            while (reader.Read())
                            {
                                data.CharityDaily.Add(new CharityDaily
                                {
                                    Charity = ReadString(reader, "Charity"),
                                    PledgeDate = ReadDateTime(reader, "PledgeDate"),
                                    Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                                    Total_donation_count = ReadInt(reader, "Total_donation_count")
                                });
                            }
                        }
                        else if (HasColumn(reader, "PledgeDate") && HasColumn(reader, "ListNo"))
                        {
                            while (reader.Read())
                            {
                                data.CampaignDaily.Add(new CampaignDaily
                                {
                                    ListNo = ReadInt(reader, "ListNo"),
                                    BankingProductType = ReadString(reader, "BankingProductType"),
                                    PledgeDate = ReadDateTime(reader, "PledgeDate"),
                                    Total_donation_amount = ReadDecimal(reader, "Total_donation_amount"),
                                    Total_donation_count = ReadInt(reader, "Total_donation_count")
                                });
                            }
                        }
                        else if (HasColumn(reader, "OperatorNo") && HasColumn(reader, "PledgeDate"))
                        {
                            while (reader.Read())
                            {
                                data.FundraiserDaily.Add(new FundraiserDaily
                                {
                                    OperatorNo = ReadInt(reader, "OperatorNo"),
                                    Supplier = ReadString(reader, "Supplier"),
                                    Surname = ReadString(reader, "Surname"),
                                    FirstName = ReadString(reader, "FirstName"),
                                    PledgeDate = ReadDateTime(reader, "PledgeDate"),
                                    Total_Raised = ReadDecimal(reader, "Total_Raised"),
                                    Total_Donation = ReadInt(reader, "Total_Donation")
                                });
                            }
                        }
                        else if (HasColumn(reader, "Charity") && HasColumn(reader, "Tot_Donation") && !HasColumn(reader, "PledgeDate"))
                        {
                            while (reader.Read())
                            {
                                var name = ReadString(reader, "Charity").Trim();
                                if (name.Length == 0) continue;
                                data.CharitySummary.Add(new DailyCharityRow
                                {
                                    Charity = name,
                                    Donations = ReadInt(reader, "Tot_Donation"),
                                    Raised = ReadDecimal(reader, "Tot_Raised"),
                                    CcDdCount = ReadInt(reader, "CC-DD-#"),
                                    CcDdAmount = ReadDecimal(reader, "CC-DD-$"),
                                    SoCount = ReadInt(reader, "SO-#"),
                                    SoAmount = ReadDecimal(reader, "SO-$"),
                                    WebCount = ReadInt(reader, "Web-#"),
                                    WebAmount = ReadDecimal(reader, "Web-$"),
                                    TdCount = ReadInt(reader, "Today-#"),
                                    TdAmount = ReadDecimal(reader, "Today-$"),
                                    Mobile = ReadInt(reader, "Mobile"),
                                    Email = ReadInt(reader, "Email"),
                                    Dob = ReadInt(reader, "DOB"),
                                    Tier50 = ReadInt(reader, "50+"),
                                    Tier100 = ReadInt(reader, "100+"),
                                    Tier200 = ReadInt(reader, "200+")
                                });
                            }
                        }
                        else if (HasColumn(reader, "PledgeDate")
                            && !HasColumn(reader, "Charity")
                            && !HasColumn(reader, "ListNo")
                            && !HasColumn(reader, "OperatorNo")
                            && (HasColumn(reader, "Total_donation_amount") || HasColumn(reader, "Total_Raised")))
                        {
                            var amountColumn = HasColumn(reader, "Total_donation_amount") ? "Total_donation_amount" : "Total_Raised";
                            var countColumn = HasColumn(reader, "Total_donation_count") ? "Total_donation_count"
                                : HasColumn(reader, "Total_Donation") ? "Total_Donation" : "";
                            while (reader.Read())
                            {
                                data.RevenueDaily.Add(new RevenueDaily
                                {
                                    PledgeDate = ReadDateTime(reader, "PledgeDate"),
                                    Raised = ReadDecimal(reader, amountColumn),
                                    Donations = countColumn.Length == 0 ? 0 : ReadInt(reader, countColumn)
                                });
                            }
                        }
                    }
                }
            }
            return data;
        }

        // Charity rows follow the daily toggle: this month, or the same day last month, through today.
        // Revenue days use the combined daily total, including head office, minus charities that are not on the summary.
        public static DailySummaryResult GetDailySummary(string supplier, string charity, string campaign, string range)
        {
            var result = new DailySummaryResult();
            var end = DateTime.Today;
            var monthStart = new DateTime(end.Year, end.Month, 1);
            var chartStart = end.AddMonths(-1);
            var wide = string.Equals(range, "30", StringComparison.OrdinalIgnoreCase);
            var summaryStart = wide ? chartStart : monthStart;

            charity = string.IsNullOrWhiteSpace(charity) ? "ALL" : charity;
            supplier = string.IsNullOrWhiteSpace(supplier) ? "ALL" : supplier;
            campaign = string.IsNullOrWhiteSpace(campaign) ? "ALL" : campaign;

            DashboardData monthData = null;
            DashboardData chartData = null;
            if (summaryStart == chartStart)
            {
                monthData = GetDashboard(summaryStart, end, charity, supplier, campaign);
                chartData = monthData;
            }
            else
            {
                Parallel.Invoke(
                    delegate { monthData = GetDashboard(summaryStart, end, charity, supplier, campaign); },
                    delegate { chartData = GetDashboard(chartStart, end, charity, supplier, campaign); });
            }

            foreach (var item in monthData.CharitySummary)
            {
                ApplyCampaigns(item, monthData);
                result.Charities.Add(item);
            }

            if (result.Charities.Count > 0)
                FillCampaignTotals(result.Charities, summaryStart, end, supplier, campaign);
            result.Charities.Sort(delegate (DailyCharityRow left, DailyCharityRow right) { return right.Raised.CompareTo(left.Raised); });
            result.AllCharities = monthData.AllCharities;
            result.AllSuppliers = monthData.AllSuppliers;
            result.AllCampaigns = monthData.AllCampaigns;
            result.Days = BuildRevenueDays(chartStart, end, RevenueForShownCharities(chartData.CharityDaily, chartData.RevenueDaily, result.Charities));
            return result;
        }

        // Combined daily totals include head-office web amounts. Remove charities that are not on the summary.
        static List<RevenueDaily> RevenueForShownCharities(List<CharityDaily> charityRows, List<RevenueDaily> combined, List<DailyCharityRow> shown)
        {
            var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in shown)
            {
                var name = (item.Charity ?? "").Trim();
                if (name.Length > 0) names.Add(name);
            }

            var byDay = new Dictionary<DateTime, RevenueDaily>();
            foreach (var row in combined)
            {
                var day = row.PledgeDate.Date;
                RevenueDaily slot;
                if (!byDay.TryGetValue(day, out slot))
                {
                    slot = new RevenueDaily { PledgeDate = day };
                    byDay[day] = slot;
                }
                slot.Raised += row.Raised;
                slot.Donations += row.Donations;
            }

            if (byDay.Count == 0)
            {
                foreach (var row in charityRows)
                {
                    var name = (row.Charity ?? "").Trim();
                    if (!names.Contains(name)) continue;
                    var day = row.PledgeDate.Date;
                    RevenueDaily slot;
                    if (!byDay.TryGetValue(day, out slot))
                    {
                        slot = new RevenueDaily { PledgeDate = day };
                        byDay[day] = slot;
                    }
                    slot.Raised += row.Total_donation_amount;
                    slot.Donations += row.Total_donation_count;
                }
                return new List<RevenueDaily>(byDay.Values);
            }

            foreach (var row in charityRows)
            {
                var name = (row.Charity ?? "").Trim();
                if (names.Contains(name)) continue;
                var day = row.PledgeDate.Date;
                RevenueDaily slot;
                if (!byDay.TryGetValue(day, out slot))
                {
                    slot = new RevenueDaily { PledgeDate = day };
                    byDay[day] = slot;
                }
                slot.Raised -= row.Total_donation_amount;
                slot.Donations -= row.Total_donation_count;
            }
            return new List<RevenueDaily>(byDay.Values);
        }

        // One slot per day, today first. Procedure rows fill the matching day; missing days stay at zero.
        static List<DailyDayAmount> BuildRevenueDays(DateTime start, DateTime end, List<RevenueDaily> source)
        {
            var days = new List<DailyDayAmount>();
            var index = new Dictionary<string, int>(StringComparer.Ordinal);
            var dayCount = (end.Date - start.Date).Days + 1;
            for (var i = 0; i < dayCount; i++)
            {
                var key = end.AddDays(-i).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                index[key] = i;
                days.Add(new DailyDayAmount { Day = key });
            }

            foreach (var row in source)
            {
                int slot;
                var key = row.PledgeDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                if (!index.TryGetValue(key, out slot)) continue;
                days[slot].Donations += row.Donations;
                days[slot].Raised += row.Raised;
            }
            return days;
        }

        // Channel columns exist only on the procedure summary, so each campaign is its own call.
        // A charity call that was already limited to that one campaign is reused.
        static void FillCampaignTotals(List<DailyCharityRow> rows, DateTime start, DateTime end, string supplier, string campaign)
        {
            var filteredList = 0;
            var filteredToOne = campaign.IndexOf(',') < 0
                && int.TryParse(campaign, NumberStyles.Integer, CultureInfo.InvariantCulture, out filteredList);
            var jobs = new List<CampaignTotalJob>();

            foreach (var row in rows)
            {
                foreach (var item in row.Campaigns)
                {
                    var onlyCampaign = row.Campaigns.Count == 1 && (campaign == "ALL" || (filteredToOne && item.ListNo == filteredList));
                    var matchesFilter = filteredToOne && item.ListNo == filteredList;
                    if (onlyCampaign || matchesFilter)
                    {
                        CopyCampaignTotals(row, item);
                        continue;
                    }
                    jobs.Add(new CampaignTotalJob { Charity = row.Charity, Campaign = item });
                }
            }

            Parallel.For(0, jobs.Count, i =>
            {
                var job = jobs[i];
                var data = GetDashboard(start, end, job.Charity, supplier, job.Campaign.ListNo.ToString(CultureInfo.InvariantCulture));
                ApplyCampaignTotals(job.Campaign, data);
            });
        }

        class CampaignTotalJob
        {
            public string Charity;
            public DailyCharityCampaign Campaign;
        }

        // Same day last month through today for one charity, from the procedure's daily charity, campaign, and fundraiser results.
        public static DailyCharityDetail GetDailyDetail(string supplier, string charity, string campaign)
        {
            var detail = new DailyCharityDetail();
            charity = (charity ?? "").Trim();
            if (charity.Length == 0 || charity.Equals("ALL", StringComparison.OrdinalIgnoreCase)) return detail;

            detail.Charity = charity;
            supplier = string.IsNullOrWhiteSpace(supplier) ? "ALL" : supplier;
            campaign = string.IsNullOrWhiteSpace(campaign) ? "ALL" : campaign;
            var end = DateTime.Today;
            var start = end.AddMonths(-1);
            var data = GetDashboard(start, end, charity, supplier, campaign);
            var days = new Dictionary<string, int>(StringComparer.Ordinal);
            var dayCount = (end.Date - start.Date).Days + 1;

            for (var i = 0; i < dayCount; i++)
            {
                var key = end.AddDays(-i).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                days[key] = i;
                detail.Days.Add(new DailyDayAmount { Day = key });
            }

            foreach (var row in data.CharityDaily)
            {
                if (!string.Equals(row.Charity, charity, StringComparison.OrdinalIgnoreCase)) continue;
                int index;
                var key = row.PledgeDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                if (!days.TryGetValue(key, out index)) continue;
                detail.Days[index].Donations += row.Total_donation_count;
                detail.Days[index].Raised += row.Total_donation_amount;
            }

            foreach (var row in data.CampaignDaily)
            {
                var key = row.PledgeDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                if (!days.ContainsKey(key)) continue;
                var product = (row.BankingProductType ?? "").Trim();
                detail.Campaigns.Add(new DailyDayBreakdown
                {
                    Name = product.Length == 0 ? "List " + row.ListNo : product + " (" + row.ListNo + ")",
                    Day = key,
                    Donations = row.Total_donation_count,
                    Raised = row.Total_donation_amount
                });
            }

            foreach (var row in data.FundraiserDaily)
            {
                var key = row.PledgeDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                if (!days.ContainsKey(key)) continue;
                var first = (row.FirstName ?? "").Trim();
                var surname = (row.Surname ?? "").Trim();
                var who = first.Length > 0 ? first : surname;
                if (who.Length == 0) who = "Unknown";
                var name = row.OperatorNo == 0 ? who : who + "[" + row.OperatorNo + "]";
                detail.Fundraisers.Add(new DailyDayBreakdown
                {
                    Name = name,
                    Supplier = row.Supplier ?? "",
                    Day = key,
                    Donations = row.Total_Donation,
                    Raised = row.Total_Raised
                });
            }

            return detail;
        }

        static void ApplyCampaigns(DailyCharityRow row, DashboardData data)
        {
            var seen = new HashSet<int>();
            foreach (var item in data.RaisedByCharityList)
            {
                if (!string.Equals(item.Charity, row.Charity, StringComparison.OrdinalIgnoreCase)) continue;
                var name = (item.BankingProductType ?? "").Trim();
                if (name.Length == 0 && item.ListNo == 0) continue;
                if (!seen.Add(item.ListNo)) continue;
                row.Campaigns.Add(new DailyCharityCampaign
                {
                    Name = name,
                    ListNo = item.ListNo
                });
            }
            row.Campaigns.Sort(delegate (DailyCharityCampaign left, DailyCharityCampaign right)
            {
                return left.ListNo.CompareTo(right.ListNo);
            });
        }

        static void CopyCampaignTotals(DailyCharityRow row, DailyCharityCampaign campaign)
        {
            campaign.Donations = row.Donations;
            campaign.Raised = row.Raised;
            campaign.CcDdCount = row.CcDdCount;
            campaign.CcDdAmount = row.CcDdAmount;
            campaign.SoCount = row.SoCount;
            campaign.SoAmount = row.SoAmount;
            campaign.WebCount = row.WebCount;
            campaign.WebAmount = row.WebAmount;
            campaign.TdCount = row.TdCount;
            campaign.TdAmount = row.TdAmount;
            campaign.Tier50 = row.Tier50;
            campaign.Tier100 = row.Tier100;
            campaign.Tier200 = row.Tier200;
            campaign.Mobile = row.Mobile;
            campaign.Email = row.Email;
            campaign.Dob = row.Dob;
        }

        static void ApplyCampaignTotals(DailyCharityCampaign campaign, DashboardData data)
        {
            if (data.Summary.Count == 0) return;
            var summary = data.Summary[0];
            campaign.Donations = summary.Total_donation_count;
            campaign.Raised = summary.Total_donation_amount;
            campaign.CcDdCount = summary.cc_dd_donations;
            campaign.CcDdAmount = summary.cc_dd_total;
            campaign.SoCount = summary.so_donations;
            campaign.SoAmount = summary.so_total;
            campaign.WebCount = summary.ho_donations;
            campaign.WebAmount = summary.ho_total;
            campaign.TdCount = summary.today_donations;
            campaign.TdAmount = summary.today_total;
            campaign.Tier50 = summary.tier50;
            campaign.Tier100 = summary.tier100;
            campaign.Tier200 = summary.tier200;
            campaign.Mobile = summary.mobile;
            campaign.Email = summary.email;
            campaign.Dob = summary.dob;
        }

        // Builds the compare periods and reads each one through the existing dashboard procedure.
        public static CompareData GetCompare(string supplier, string charity, string campaign, string compareType, DateTime? from, DateTime? to)
        {
            var data = new CompareData();
            string message;
            var ranges = BuildCompareRanges(compareType, from, to, out message);
            data.CompareType = compareType ?? "month";
            data.Message = message;
            if (ranges.Count == 0) return data;

            charity = string.IsNullOrWhiteSpace(charity) ? "ALL" : charity;
            supplier = string.IsNullOrWhiteSpace(supplier) ? "ALL" : supplier;
            campaign = string.IsNullOrWhiteSpace(campaign) ? "ALL" : campaign;

            var loaded = new DashboardData[ranges.Count];
            Parallel.For(0, ranges.Count, i =>
            {
                loaded[i] = GetDashboard(ranges[i].Start, ranges[i].End, charity, supplier, campaign);
            });

            for (var i = 0; i < ranges.Count; i++)
            {
                var range = ranges[i];
                var dashboard = loaded[i];
                var summary = dashboard.Summary.Count > 0 ? dashboard.Summary[0] : null;
                data.Periods.Add(new ComparePeriod
                {
                    Label = range.Label,
                    Start = range.Start,
                    End = range.End,
                    Raised = summary == null ? 0 : summary.Total_donation_amount,
                    Donations = summary == null ? 0 : summary.Total_donation_count,
                    AvgGift = summary == null ? 0 : summary.Avg_gift,
                    DeclinedCount = summary == null ? 0 : summary.Total_declined_count,
                    DeclinedRate = summary == null ? 0 : summary.Total_declined_rate,
                    SoPledged = summary == null ? 0 : summary.C1p,
                    SoReceived = summary == null ? 0 : summary.C1r,
                    SoReturn = summary == null ? (decimal?)null : summary.C1p_C1r_perc
                });

                foreach (var row in dashboard.RaisedByCharity)
                {
                    data.ByClient.Add(new CompareBreakdown
                    {
                        Name = row.Charity,
                        Label = range.Label,
                        Raised = row.Total_donation_amount,
                        Donations = Convert.ToInt32(row.Total_donation_count)
                    });
                }

                foreach (var row in dashboard.RaisedBySupplier)
                {
                    data.BySupplier.Add(new CompareBreakdown
                    {
                        Name = row.Supplier,
                        Label = range.Label,
                        Raised = row.Total_donation_amount,
                        Donations = row.Total_donation_count
                    });
                }

                foreach (var row in dashboard.Top10Fundraisers)
                {
                    var name = string.IsNullOrWhiteSpace(row.FirstName) ? row.Surname : row.FirstName;
                    if (string.IsNullOrWhiteSpace(name)) name = "Unknown";
                    data.ByOperator.Add(new CompareOperator
                    {
                        Name = name.Trim() + "[" + row.OperatorNo + "]",
                        Supplier = row.Supplier,
                        Label = range.Label,
                        Donations = row.Total_Donation,
                        Raised = row.Total_Raised
                    });
                }
            }

            return data;
        }

        class CompareRange
        {
            public string Label { get; set; }
            public DateTime Start { get; set; }
            public DateTime End { get; set; }
        }

        static List<CompareRange> BuildCompareRanges(string compareType, DateTime? from, DateTime? to, out string message)
        {
            message = null;
            var type = (compareType ?? "month").ToLowerInvariant();
            var ranges = new List<CompareRange>();

            if (type == "ytd")
            {
                AddRecentMonths(ranges, 12);
                return ranges;
            }

            if (type == "custom")
            {
                if (!from.HasValue || !to.HasValue)
                {
                    message = "Choose a from month and a to month.";
                    return ranges;
                }

                var start = new DateTime(from.Value.Year, from.Value.Month, 1);
                var endMonth = new DateTime(to.Value.Year, to.Value.Month, 1);
                if (endMonth < start)
                {
                    message = "The to month is before the from month.";
                    return ranges;
                }

                var count = ((endMonth.Year - start.Year) * 12) + endMonth.Month - start.Month + 1;
                if (count > 24)
                {
                    message = "Choose a range of 24 months or less.";
                    return ranges;
                }

                for (var month = start; month <= endMonth; month = month.AddMonths(1))
                {
                    ranges.Add(new CompareRange
                    {
                        Label = month.ToString("MMMM yyyy", CultureInfo.InvariantCulture),
                        Start = month,
                        End = month.AddMonths(1).AddDays(-1)
                    });
                }

                return ranges;
            }

            AddRecentMonths(ranges, 6);
            return ranges;
        }

        // One column per month, including the current month. 6 months from October 2026 is May 2026 through October 2026.
        static void AddRecentMonths(List<CompareRange> ranges, int count)
        {
            var firstOfThisMonth = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            for (var i = count - 1; i >= 0; i--)
            {
                var start = firstOfThisMonth.AddMonths(-i);
                ranges.Add(new CompareRange
                {
                    Label = start.ToString("MMMM yyyy", CultureInfo.InvariantCulture),
                    Start = start,
                    End = start.AddMonths(1).AddDays(-1)
                });
            }
        }

        static bool HasColumn(SqlDataReader reader, string column)
        {
            for (var i = 0; i < reader.FieldCount; i++)
            {
                if (string.Equals(reader.GetName(i), column, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        // Null text from SQL becomes an empty string.
        static string ReadString(SqlDataReader reader, string column)
        {
            var value = reader[column];
            return value == DBNull.Value ? "" : Convert.ToString(value);
        }

        // Null numbers from SQL become 0.
        static int ReadInt(SqlDataReader reader, string column)
        {
            var value = reader[column];
            return value == DBNull.Value ? 0 : Convert.ToInt32(value);
        }

        // Null amounts from SQL become 0.
        static decimal ReadDecimal(SqlDataReader reader, string column)
        {
            var value = reader[column];
            return value == DBNull.Value ? 0m : Convert.ToDecimal(value);
        }

        // Null dates from SQL become DateTime.MinValue. This is safe for JavaScript.
        static DateTime ReadDateTime(SqlDataReader reader, string column)
        {
            var value = reader[column];
            return value == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(value);
        }

    }
}
