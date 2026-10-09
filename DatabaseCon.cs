using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
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

            // 0 and 1 are one calendar month. 3 and 6 run through the end of last month.
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
                            ho_total = ReadDecimal(reader, "ho_total"),
                            ho_donations = ReadInt(reader, "ho_donations"),
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
                            cc_dd_total = ReadDecimal(reader, "cc_dd_total"),
                            so_total = ReadDecimal(reader, "so_total"),
                            ho_total = ReadDecimal(reader, "ho_total")
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
                }
            }
            return data;
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
