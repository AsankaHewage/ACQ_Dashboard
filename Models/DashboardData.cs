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
        public decimal L1p { get; set; }
        public decimal L1r { get; set; }
        public decimal L1p_L1r_perc { get; set; }
        public decimal L2p { get; set; }
        public decimal L2r { get; set; }
        public decimal L2p_L2r_perc { get; set; }
        public decimal L3p { get; set; }
        public decimal L3r { get; set; }
        public decimal L3p_L3r_perc { get; set; }
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
    }

    // Result set 3. One agency slice for the donut. Donation_percent is that agency's share of the total.
    public class RaisedBySupplier
    {
        public string Supplier { get; set; }
        public decimal Total_donation_amount { get; set; }
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

    // Result set 4. Charities in the current result, used for the client count.
    public class ClientShown
    {
        public string Charity { get; set; }
        //public int ListNo { get; set; }
        //public string BankingProductType { get; set; }
    }
}
