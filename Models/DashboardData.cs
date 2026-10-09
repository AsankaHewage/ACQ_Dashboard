using System;
using System.Collections.Generic;

namespace ACQFundraisingDashboard.Models
{
    // The five result sets from dbo.ACQFundraisingDashboard, in procedure order.
    public class DashboardData
    {
        public List<DatePickerRange> DatePicker { get; set; }
        public List<DashboardSummary> Summary { get; set; }
        public List<RaisedByCharity> RaisedByCharity { get; set; }
        public List<RaisedByCharityList> RaisedByCharityList { get; set; }
        public List<RaisedBySupplier> RaisedBySupplier { get; set; }
        public List<RaisedByCampaign> RaisedByCampaign { get; set; }
        public List<ClientShown> ClientShown { get; set; }
        public List<AllSuppliers> AllSuppliers { get; set; }
        public List<AllCharities> AllCharities { get; set; }
        public List<AllCampaigns> AllCampaigns { get; set; }
        public List<Top10Fundraisers> Top10Fundraisers { get; set; }
        public List<StateDemographics> StateDemographics { get; set; }
        public List<GenderDemographics> GenderDemographics { get; set; } 

        // Starts every list empty so a missing result set is still safe to read.
        public DashboardData()
        {
            DatePicker = new List<DatePickerRange>();
            Summary = new List<DashboardSummary>();
            RaisedByCharity = new List<RaisedByCharity>();
            RaisedByCharityList = new List<RaisedByCharityList>();
            RaisedBySupplier = new List<RaisedBySupplier>();
            RaisedByCampaign = new List<RaisedByCampaign>();
            ClientShown = new List<ClientShown>();
            AllSuppliers = new List<AllSuppliers>();
            AllCharities = new List<AllCharities>();
            AllCampaigns = new List<AllCampaigns>();
            Top10Fundraisers = new List<Top10Fundraisers>();
            StateDemographics = new List<StateDemographics>();
            GenderDemographics = new List<GenderDemographics>();
        }
    }

    public class DatePickerRange
    {
        public DateTime start_date { get; set; }
        public DateTime end_date { get; set; }

    }

    // Result set 0. One row of totals for the summary KPIs and the client view.
    public class DashboardSummary
    {
        public decimal Total_donation_amount { get; set; }
        public int Total_donation_count { get; set; }
        public int Client_count { get; set; }
        public decimal Avg_gift { get; set; }
        public int Total_declined_count { get; set; }
        public decimal Total_declined_rate { get; set; }
        // Card, direct debit, card/DD combined, standing order, telemarketing (TD), and web (head office).
        public decimal cc_total { get; set; }
        public int cc_donations { get; set; }
        public decimal dd_total { get; set; }
        public int dd_donations { get; set; }
        public decimal cc_dd_total { get; set; }
        public int cc_dd_donations { get; set; }
        public decimal so_total { get; set; }
        public int so_donations { get; set; }
        //public decimal td_total { get; set; }
        //public int td_donations { get; set; }
        public decimal ho_total { get; set; }
        public int ho_donations { get; set; }
        // Pledges dated today. This is separate from telemarketing.
        public decimal today_total { get; set; }
        public int today_donations { get; set; }
        // Donor counts at $50+, $100+, and $200+.
        public int tier50less { get; set; }
        public int tier50 { get; set; }
        public int tier100 { get; set; }
        public int tier200 { get; set; }
        // Donors with a mobile, email, or date of birth, plus each share of donations.
        public int mobile { get; set; }
        public decimal mobile_perc { get; set; }
        public int email { get; set; }
        public decimal email_perc { get; set; }
        public int dob { get; set; }
        public decimal dob_perc { get; set; }
        // Standing-order pledged (p) and received (r) for the three lookback months, and each return percent.
        public DateTime L1date { get; set; }
        public decimal L1p { get; set; }
        public decimal L1r { get; set; }
        public decimal L1p_L1r_perc { get; set; }
        public DateTime L2date { get; set; }
        public decimal L2p { get; set; }
        public decimal L2r { get; set; }
        public decimal L2p_L2r_perc { get; set; }
        public DateTime L3date { get; set; }
        public decimal L3p { get; set; }
        public decimal L3r { get; set; }
        public decimal L3p_L3r_perc { get; set; }
        public DateTime L4date { get; set; }
        public decimal L4p { get; set; }
        public decimal L4r { get; set; }
        public decimal L4p_L4r_perc { get; set; }
        public DateTime L5date { get; set; }
        public decimal L5p { get; set; }
        public decimal L5r { get; set; }
        public decimal L5p_L5r_perc { get; set; }
        public DateTime L6date { get; set; }
        public decimal L6p { get; set; }
        public decimal L6r { get; set; }
        public decimal L6p_L6r_perc { get; set; }
        public DateTime L7date { get; set; }
        public decimal L7p { get; set; }
        public decimal L7r { get; set; }
        public decimal L7p_L7r_perc { get; set; }
    }

    // Result set 1. Raised amount for one charity, used by the bar chart.
    public class RaisedByCharity
    {
        //public string Supplier { get; set; }
        public string Charity { get; set; }
        public decimal Total_donation_amount { get; set; }
        public decimal Total_donation_count { get; set; }

    }

    // Result set 2. One clients-table row per charity and campaign. L3p_L3r_perc is the latest return.
    public class RaisedByCharityList
    {
        public string Supplier { get; set; }
        public string Charity { get; set; }
        public int ListNo { get; set; }
        public string BankingProductType { get; set; }
        public decimal Total_donation_amount { get; set; }
        public int Total_donation_count { get; set; }
        public decimal Gift_avg { get; set; }
        public int Declined_count { get; set; }
        public decimal Declined_rate { get; set; }
    }

    // Result set 3. One agency slice for the donut. Donation_percent is that agency's share of the total.
    public class RaisedBySupplier
    {
        public string Supplier { get; set; }
        public decimal Total_donation_amount { get; set; }
        public int Total_donation_count { get; set; }
        public decimal Donation_percent { get; set; }
    }

    // Result set 4. One campaign slice for the donut.
    public class RaisedByCampaign
    {
        public int ListNo { get; set; }
        public string BankingProductType { get; set; }
        public decimal Total_donation_amount { get; set; }
        public int Total_donation_count { get; set; }
    }

    // Result set 5. Charities in the current result, used for the client count (based on supplier and charity selections).
    public class ClientShown
    {
        public string Charity { get; set; }
        //public int ListNo { get; set; }
        //public string BankingProductType { get; set; }
    }

    // Result set 6. All suppliers in the current result, used for the filter
    public class AllSuppliers
    {
        public string Supplier { get; set; }
    }

    // Result set 7. All charities in the current result, used for the filter
    public class AllCharities
    {
        public string Charity { get; set; }
    }

    // Result set 8. All campaigns in the current result, used for the filter
    public class AllCampaigns
    {
        public int ListNo { get; set; }
        public string BankingProductType { get; set; }
    }

    // Result set 9. Top 10 fundraisers, used for the top 10 fundraisers table.
    public class Top10Fundraisers
    {
        public int OperatorNo { get; set; }
        public string Supplier { get; set; }
        public string Surname { get; set; }
        public string FirstName { get; set; }
        public decimal Total_Raised { get; set; }
        public decimal cc_dd_total { get; set; }
        public decimal so_total { get; set; }
        public decimal ho_total { get; set; }
    }

    // Result set 10. State demographics, used for the state demographics table.
    public class StateDemographics
    {
        public string State { get; set; }
        public int Total { get; set; }
        public decimal Percentage { get; set; }
    }

    // Result set 11. Gender demographics, used for the gender demographics table.
    public class GenderDemographics
    {
        public int Male { get; set; }
        public int Female { get; set; }
        public decimal Male_Percent { get; set; }
        public decimal Female_Percent { get; set; }
    }
}
