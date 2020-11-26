import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import { Pie } from "react-chartjs";

const styles = StyleSheet.create({
  label: {
    width: 20,
    padding: 5,
    margin: 5,
    fontSize: 12
  }
});

const Chart = ({ data }) => {
  const chartColors = ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360"];

  const pieData = data.map(([label, value], index) => ({
    label,
    value,
    color: chartColors[index % chartColors.length]
  }));

  return (
    <div>
      <Pie data={pieData} />
      <div>
        {pieData.map(({ label, color }) => (
          <span
            key={label}
            className={css(styles.label)}
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

Chart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.array).isRequired
};

export default Chart;
