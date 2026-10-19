using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Globalization;
using System.Web.Mvc;

namespace ACQFundraisingDashboard.Controllers
{
    public class HomeController : Controller
    {
        // Shows the dashboard page. The script loads the figures after this view is open.
        public ActionResult Index()
        {
            return View();
        }

        // Returns the procedure result as JSON. supplier, charity, and campaign come from the script's query string.
        public ActionResult Dashboard(string supplier, string charity, string campaign, int month)
        {
            var json = JsonConvert.SerializeObject(
                DatabaseCon.GetDashboard(supplier, charity, campaign, month),
                new JsonSerializerSettings
                {
                    // Total_donation_amount becomes total_donation_amount for the script.
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                });
            return Content(json, "application/json");
        }

        // Returns one row per period, plus client and supplier rows for those same periods.
        public ActionResult Compare(string supplier, string charity, string campaign, string compareType, string from, string to)
        {
            var json = JsonConvert.SerializeObject(
                DatabaseCon.GetCompare(supplier, charity, campaign, compareType, ParseDate(from), ParseDate(to)),
                new JsonSerializerSettings
                {
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                });
            return Content(json, "application/json");
        }

        static DateTime? ParseDate(string value)
        {
            DateTime parsed;
            if (DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed)
                || DateTime.TryParseExact(value, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
                return parsed.Date;
            return null;
        }

        // Template pages. The dashboard does not use these.
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}