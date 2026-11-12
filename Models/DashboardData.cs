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
        // Daily rows appended by the procedure. Used by the charity drill-down, not the summary JSON.
        [Newtonsoft.Json.JsonIgnore]
        public List<CharityDaily> CharityDaily { get; set; }
        [Newtonsoft.Json.JsonIgnore]
        public List<CampaignDaily> CampaignDaily { get; set; }
        [Newtonsoft.Json.JsonIgnore]
        public List<FundraiserDaily> FundraiserDaily { get; set; }
        // Charity channel totals and the combined day-by-day revenue. Not part of the summary JSON.
        [Newtonsoft.Json.JsonIgnore]
        public List<DailyCharityRow> CharitySummary { get; set; }
        [Newtonsoft.Json.JsonIgnore]
        public List<RevenueDaily> RevenueDaily { get; set; } 

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
            CharityDaily = new List<CharityDaily>();
            CampaignDaily = new List<CampaignDaily>();
            FundraiserDaily = new List<FundraiserDaily>();
            CharitySummary = new List<DailyCharityRow>();
            RevenueDaily = new List<RevenueDaily>();
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
        // Standing-order pledged and return percent for the selected date range.
        public DateTime C1date { get; set; }
        public decimal C1p { get; set; }
        public decimal C1r { get; set; }
        public decimal C1p_C1r_perc { get; set; }
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
        public int Total_Donation { get; set; }
        public decimal cc_dd_total { get; set; }
        public int cc_dd_total_count { get; set; }
        public decimal so_total_p { get; set; }
        public decimal so_total_r { get; set; }
        public int so_total_r_count { get; set; }
        public int so_total_count { get; set; }
        public int cc_dd_decline_count { get; set; }
        public decimal decline_rate { get; set; }
        public decimal so_return_rate { get; set; }
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

    // One period in a comparison. Change against the previous period is calculated on the page.
    public class ComparePeriod
    {
        public string Label { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public decimal Raised { get; set; }
        public int Donations { get; set; }
        public decimal AvgGift { get; set; }
        public int DeclinedCount { get; set; }
        public decimal DeclinedRate { get; set; }
        public decimal SoPledged { get; set; }
        public decimal SoReceived { get; set; }
        public decimal? SoReturn { get; set; }
    }

    // Raised and donations for one client or supplier inside one period.
    public class CompareBreakdown
    {
        public string Name { get; set; }
        public string Label { get; set; }
        public decimal Raised { get; set; }
        public int Donations { get; set; }
    }

    public class CompareData
    {
        public string CompareType { get; set; }
        public string Message { get; set; }
        public List<ComparePeriod> Periods { get; set; }
        public List<CompareBreakdown> ByClient { get; set; }
        public List<CompareBreakdown> BySupplier { get; set; }
        public List<CompareOperator> ByOperator { get; set; }

        public CompareData()
        {
            Periods = new List<ComparePeriod>();
            ByClient = new List<CompareBreakdown>();
            BySupplier = new List<CompareBreakdown>();
            ByOperator = new List<CompareOperator>();
        }
    }

    // One operator in one compared month.
    public class CompareOperator
    {
        public string Name { get; set; }
        public string Supplier { get; set; }
        public string Label { get; set; }
        public int Donations { get; set; }
        public decimal Raised { get; set; }
    }

    // One campaign shown under a charity on the daily acquisition summary.
    public class DailyCharityCampaign
    {
        public string Name { get; set; }
        public int ListNo { get; set; }
        public int Donations { get; set; }
        public decimal Raised { get; set; }
        public int CcDdCount { get; set; }
        public decimal CcDdAmount { get; set; }
        public int SoCount { get; set; }
        public decimal SoAmount { get; set; }
        public int WebCount { get; set; }
        public decimal WebAmount { get; set; }
        public int TdCount { get; set; }
        public decimal TdAmount { get; set; }
        public int Tier50 { get; set; }
        public int Tier100 { get; set; }
        public int Tier200 { get; set; }
        public int Mobile { get; set; }
        public int Email { get; set; }
        public int Dob { get; set; }
    }

    // One charity on the daily acquisition summary. TD is pledges dated today.
    public class DailyCharityRow
    {
        public string Charity { get; set; }
        public int Donations { get; set; }
        public decimal Raised { get; set; }
        public int CcDdCount { get; set; }
        public decimal CcDdAmount { get; set; }
        public int SoCount { get; set; }
        public decimal SoAmount { get; set; }
        public int WebCount { get; set; }
        public decimal WebAmount { get; set; }
        public int TdCount { get; set; }
        public decimal TdAmount { get; set; }
        public int Tier50 { get; set; }
        public int Tier100 { get; set; }
        public int Tier200 { get; set; }
        public int Mobile { get; set; }
        public int Email { get; set; }
        public int Dob { get; set; }
        public List<DailyCharityCampaign> Campaigns { get; set; }

        public DailyCharityRow()
        {
            Campaigns = new List<DailyCharityCampaign>();
        }
    }

    // Last 30 days for one charity: daily totals, then campaign and fundraiser rows.
    public class DailyCharityDetail
    {
        public string Charity { get; set; }
        public List<DailyDayAmount> Days { get; set; }
        public List<DailyDayBreakdown> Campaigns { get; set; }
        public List<DailyDayBreakdown> Fundraisers { get; set; }

        public DailyCharityDetail()
        {
            Days = new List<DailyDayAmount>();
            Campaigns = new List<DailyDayBreakdown>();
            Fundraisers = new List<DailyDayBreakdown>();
        }
    }

    public class DailyDayAmount
    {
        public string Day { get; set; }
        public int Donations { get; set; }
        public decimal Raised { get; set; }
    }

    // Daily Activity payload: charity rows plus one point per day for the ACQ Revenue chart.
    public class DailySummaryResult
    {
        public List<DailyCharityRow> Charities { get; set; }
        public List<DailyDayAmount> Days { get; set; }
        public List<AllCharities> AllCharities { get; set; }
        public List<AllSuppliers> AllSuppliers { get; set; }
        public List<AllCampaigns> AllCampaigns { get; set; }

        public DailySummaryResult()
        {
            Charities = new List<DailyCharityRow>();
            Days = new List<DailyDayAmount>();
            AllCharities = new List<AllCharities>();
            AllSuppliers = new List<AllSuppliers>();
            AllCampaigns = new List<AllCampaigns>();
        }
    }

    // One day of combined donations and raised from Total_raised_donation_daily.
    public class RevenueDaily
    {
        public DateTime PledgeDate { get; set; }
        public decimal Raised { get; set; }
        public int Donations { get; set; }
    }

    // One charity on one pledge date from #Total_raised_by_charity_table_daily.
    public class CharityDaily
    {
        public string Charity { get; set; }
        public DateTime PledgeDate { get; set; }
        public decimal Total_donation_amount { get; set; }
        public int Total_donation_count { get; set; }
    }

    // One campaign on one pledge date from #Total_raised_by_campaign_daily.
    public class CampaignDaily
    {
        public int ListNo { get; set; }
        public string BankingProductType { get; set; }
        public DateTime PledgeDate { get; set; }
        public decimal Total_donation_amount { get; set; }
        public int Total_donation_count { get; set; }
    }

    // One fundraiser on one pledge date from #Top10_fr_table_daily.
    public class FundraiserDaily
    {
        public int OperatorNo { get; set; }
        public string Supplier { get; set; }
        public string Surname { get; set; }
        public string FirstName { get; set; }
        public DateTime PledgeDate { get; set; }
        public decimal Total_Raised { get; set; }
        public int Total_Donation { get; set; }
    }

    // One campaign or fundraiser on one day. Supplier is set for fundraisers.
    public class DailyDayBreakdown
    {
        public string Name { get; set; }
        public string Supplier { get; set; }
        public string Day { get; set; }
        public int Donations { get; set; }
        public decimal Raised { get; set; }
    }
}
