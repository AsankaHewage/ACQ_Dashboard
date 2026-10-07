using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
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

        // Returns the procedure result as JSON. supplier and charity come from the script's query string.
        public ActionResult Dashboard(string supplier, string charity, int month)
        {
            var json = JsonConvert.SerializeObject(
                DatabaseCon.GetDashboard(supplier, charity, month),
                new JsonSerializerSettings
                {
                    // Total_donation_amount becomes total_donation_amount for the script.
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                });
            return Content(json, "application/json");
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