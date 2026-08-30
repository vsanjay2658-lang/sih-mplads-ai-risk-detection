
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [stats, setStats] = useState({
    projects: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    remainingFunds: 0,
    completedProjectsWithSavings: 0,
    areasWithSavings: 0,
  });

  const [areaOpportunities, setAreaOpportunities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // ==================================================
        // 1. PROJECT COUNT
        // ==================================================
        const {
          count: projectCount,
          error: projectError,
        } = await supabase
          .from("projects")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("dataset_id", 2);

        if (projectError) {
          throw projectError;
        }

        // ==================================================
        // 2. RISK ASSESSMENTS
        // ==================================================

        // ==================================================
        // 2. FETCH ALL RISK ASSESSMENTS
        // ==================================================

        const RISK_PAGE_SIZE = 1000;

        let allRisks = [];
        let riskFrom = 0;

        while (true) {
          const riskTo =
            riskFrom + RISK_PAGE_SIZE - 1;

          const {
            data: riskPage,
            error: riskError,
          } = await supabase
            .from("risk_assessments")
            .select(
              "risk_level, final_risk_score, project_id"
            )
            .range(riskFrom, riskTo);

          if (riskError) {
            throw riskError;
          }

          if (
            !riskPage ||
            riskPage.length === 0
          ) {
            break;
          }

          allRisks = [
            ...allRisks,
            ...riskPage,
          ];

          console.log(
            `Risk assessments fetched: ${allRisks.length.toLocaleString()}`
          );

          if (
            riskPage.length < RISK_PAGE_SIZE
          ) {
            break;
          }

          riskFrom += RISK_PAGE_SIZE;
        }

        const risks = allRisks;

        let highRisk = 0;
        let mediumRisk = 0;
        let lowRisk = 0;

        (risks || []).forEach((risk) => {
          const level = String(
            risk.risk_level || ""
          ).toLowerCase();

          if (level.includes("high")) {
            highRisk++;
          } else if (level.includes("medium")) {
            mediumRisk++;
          } else if (level.includes("low")) {
            lowRisk++;
          }
        });

        // ==================================================
        // 3. FETCH PROJECTS
        // ==================================================

        const PAGE_SIZE = 1000;

        let allProjects = [];
        let from = 0;

        while (true) {
          const to = from + PAGE_SIZE - 1;

          const {
            data: projects,
            error: projectsError,
          } = await supabase
            .from("projects")
            .select(
              `
      id,
      work_id,
      state,
      mp_name,
      constituency,
      work_status,
      sanction_amount,
      final_amount,
      total_expenditure
    `
            )
            .eq("dataset_id", 2)
            .range(from, to);
          if (projectsError) {
            throw projectsError;
          }

          if (
            !projects ||
            projects.length === 0
          ) {
            break;
          }

          allProjects = [
            ...allProjects,
            ...projects,
          ];

          if (projects.length < PAGE_SIZE) {
            break;
          }

          from += PAGE_SIZE;
        }

        // ==================================================
        // 4. CALCULATE REMAINING FUNDS
        // ==================================================

        let remainingFunds = 0;

        let completedProjectsWithSavings = 0;

        // Area aggregation object
        const areaMap = {};

        allProjects.forEach((project) => {
          const status = String(
            project.work_status || ""
          ).toLowerCase();

          // ----------------------------------------------
          // Determine whether project is completed
          // ----------------------------------------------

          const isCompleted =
            status.includes("complete") ||
            status.includes("completed") ||
            status.includes("finish") ||
            status.includes("finished");

          if (!isCompleted) {
            return;
          }

          // ----------------------------------------------
          // Financial values
          // ----------------------------------------------

          const sanction = Number(
            project.sanction_amount
          );

          let finalAmount = Number(
            project.final_amount
          );

          // If final_amount isn't available,
          // use total_expenditure.
          if (
            !Number.isFinite(finalAmount) ||
            finalAmount <= 0
          ) {
            finalAmount = Number(
              project.total_expenditure
            );
          }

          if (
            !Number.isFinite(sanction) ||
            !Number.isFinite(finalAmount)
          ) {
            return;
          }

          const remaining =
            sanction - finalAmount;

          // Only positive savings
          if (remaining <= 0) {
            return;
          }

          // ----------------------------------------------
          // Global totals
          // ----------------------------------------------

          remainingFunds += remaining;

          completedProjectsWithSavings++;

          // ----------------------------------------------
          // AREA
          // ----------------------------------------------

          const state =
            project.state?.trim() ||
            "Unknown State";

          const constituency =
            project.constituency?.trim() ||
            "Unknown Constituency";

          const areaKey =
            `${state}|||${constituency}`;

          // ----------------------------------------------
          // Create area
          // ----------------------------------------------

          if (!areaMap[areaKey]) {
            areaMap[areaKey] = {
              state,
              constituency,
              projects: 0,
              sanctioned: 0,
              expenditure: 0,
              remaining: 0,
            };
          }

          // ----------------------------------------------
          // Add project
          // ----------------------------------------------

          areaMap[areaKey].projects += 1;

          areaMap[areaKey].sanctioned +=
            sanction;

          areaMap[areaKey].expenditure +=
            finalAmount;

          areaMap[areaKey].remaining +=
            remaining;
        });

        // ==================================================
        // 5. SORT AREA OPPORTUNITIES
        // ==================================================

        const areas = Object.values(
          areaMap
        )
          .map((area) => {
            const savingsPercentage =
              area.sanctioned > 0
                ? (
                  (area.remaining /
                    area.sanctioned) *
                  100
                )
                : 0;

            return {
              ...area,
              savingsPercentage,
            };
          })
          .sort(
            (a, b) =>
              b.remaining - a.remaining
          );

        // Keep top 10
        const topAreas = areas.slice(
          0,
          10
        );

        // ==================================================
        // 6. UPDATE STATE
        // ==================================================

        setStats({
          projects: projectCount || 0,
          highRisk,
          mediumRisk,
          lowRisk,
          remainingFunds,
          completedProjectsWithSavings,
          areasWithSavings: areas.length,
        });

        setAreaOpportunities(
          topAreas
        );

      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="loading">
        Loading MPLADS Dashboard...
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <div className="error">
        <h2>
          Supabase Error
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  // ======================================================
  // FORMAT CURRENCY
  // ======================================================

  function formatCurrency(value) {
    if (!Number.isFinite(value)) {
      return "₹0";
    }

    return `₹${value.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    )}`;
  }

  // ======================================================
  // DASHBOARD
  // ======================================================

  return (
    <div className="dashboard">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <header className="header">

        <div>
          <h1>
            MPLADS AI Risk Detection
          </h1>

          <p>
            Public expenditure monitoring
            and risk analysis
          </p>
        </div>

        <div className="status">
          ● System Online
        </div>

      </header>

      <main>

        {/* ============================================ */}
        {/* HERO */}
        {/* ============================================ */}

        <section className="hero">

          <h2>
            Project Risk Overview
          </h2>

          <p>
            AI-assisted monitoring of MPLADS
            projects, expenditure and
            implementation risks.
          </p>

        </section>

        {/* ============================================ */}
        {/* RISK CARDS */}
        {/* ============================================ */}

        <section className="cards">

          <div className="card">

            <span>
              Total Projects
            </span>

            <strong>
              {stats.projects.toLocaleString()}
            </strong>

          </div>

          <div className="card high">

            <span>
              High Risk
            </span>

            <strong>
              {stats.highRisk.toLocaleString()}
            </strong>

          </div>

          <div className="card medium">

            <span>
              Medium Risk
            </span>

            <strong>
              {stats.mediumRisk.toLocaleString()}
            </strong>

          </div>

          <div className="card low">

            <span>
              Low Risk
            </span>

            <strong>
              {stats.lowRisk.toLocaleString()}
            </strong>

          </div>

        </section>

        {/* ============================================ */}
        {/* FUND OPPORTUNITY */}
        {/* ============================================ */}

        <section className="fund-card">

          <div>

            <h2>
              Potential Remaining Fund
            </h2>

            <p>
              Estimated funds remaining from
              completed projects where the
              final expenditure is lower than
              the sanctioned amount.
            </p>

            <p>
              These funds represent a
              <strong>
                {" "}potential opportunity
              </strong>{" "}
              to identify additional eligible
              welfare works in the same area,
              subject to applicable MPLADS
              rules, approvals and actual
              fund availability.
            </p>

            <p>
              <strong>
                {stats.completedProjectsWithSavings.toLocaleString()}
              </strong>{" "}
              completed projects currently
              show positive expenditure
              savings across{" "}
              <strong>
                {stats.areasWithSavings.toLocaleString()}
              </strong>{" "}
              constituencies.
            </p>

          </div>

          <div className="fund-value">

            {formatCurrency(
              stats.remainingFunds
            )}

          </div>

        </section>

        {/* ============================================ */}
        {/* AREA OPPORTUNITIES */}
        {/* ============================================ */}

        <section className="area-section">

          <div className="section-header">

            <div>

              <h2>
                Area-wise Fund Opportunities
              </h2>

              <p>
                Constituencies with the highest
                potential remaining funds from
                completed projects.
              </p>

            </div>

            <div className="area-count">

              {stats.areasWithSavings}

              <span>
                areas identified
              </span>

            </div>

          </div>

          <div className="area-list">

            {areaOpportunities.length === 0 ? (

              <div className="empty">
                No completed projects with
                positive savings found.
              </div>

            ) : (

              areaOpportunities.map(
                (area, index) => (

                  <div
                    className="area-row"
                    key={`${area.state}-${area.constituency}`}
                  >

                    <div className="area-rank">
                      #{index + 1}
                    </div>

                    <div className="area-details">

                      <h3>
                        {area.constituency}
                      </h3>

                      <p>
                        {area.state}
                      </p>

                    </div>

                    <div className="area-projects">

                      <strong>
                        {area.projects}
                      </strong>

                      <span>
                        projects
                      </span>

                    </div>

                    <div className="area-financial">

                      <span>
                        Potential remaining
                      </span>

                      <strong>
                        {formatCurrency(
                          area.remaining
                        )}
                      </strong>

                    </div>

                    <div className="area-percentage">

                      <strong>
                        {area.savingsPercentage.toFixed(
                          1
                        )}
                        %
                      </strong>

                      <span>
                        savings
                      </span>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>

        {/* ============================================ */}
        {/* SYSTEM STATUS */}
        {/* ============================================ */}

        <section className="info">

          <h2>
            System Status
          </h2>

          <p>
            ✓ Supabase connected
          </p>

          <p>
            ✓{" "}
            {stats.projects.toLocaleString()}{" "}
            projects loaded
          </p>

          <p>
            ✓{" "}
            {(
              stats.highRisk +
              stats.mediumRisk +
              stats.lowRisk
            ).toLocaleString()}{" "}
            risk assessments loaded
          </p>

          <p>
            ✓{" "}
            {stats.completedProjectsWithSavings.toLocaleString()}{" "}
            completed projects with potential
            remaining funds identified
          </p>

        </section>

      </main>

    </div>
  );
}

export default App;

