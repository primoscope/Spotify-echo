"""
Experiment Multi-Metric Evaluation & Guardrails

Implements automated metric analysis, guardrail enforcement, and breach detection
for A/B testing and experimentation framework.

Part of EXP workstream - Phase 2.1 Core Models
"""

import os
import json
import logging
import time
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Tuple, Optional, Union
from dataclasses import dataclass, asdict
from collections import defaultdict
from enum import Enum
import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger(__name__)


class MetricType(Enum):
    """Types of experiment metrics"""
    CTR = "ctr"  # Click-through rate
    LATENCY = "latency"  # Response latency
    DIVERSITY = "diversity"  # Recommendation diversity
    ENGAGEMENT = "engagement"  # User engagement
    CONVERSION = "conversion"  # Conversion rate
    RETENTION = "retention"  # User retention


class GuardrailType(Enum):
    """Types of guardrail checks"""
    THRESHOLD = "threshold"  # Simple threshold check
    DEGRADATION = "degradation"  # Relative degradation vs control
    STATISTICAL = "statistical"  # Statistical significance test
    RATIO = "ratio"  # Ratio-based check


@dataclass
class MetricDefinition:
    """Definition of an experiment metric"""
    name: str
    metric_type: MetricType
    description: str
    aggregation: str = "mean"  # mean, median, sum, count
    higher_is_better: bool = True
    confidence_level: float = 0.95
    min_sample_size: int = 100


@dataclass
class GuardrailDefinition:
    """Definition of an experiment guardrail"""
    name: str
    metric_name: str
    guardrail_type: GuardrailType
    threshold: float
    direction: str = "upper"  # upper, lower, both
    severity: str = "warning"  # warning, critical
    description: str = ""


@dataclass
class MetricResult:
    """Result of metric calculation"""
    metric_name: str
    variant: str
    value: float
    confidence_interval: Tuple[float, float]
    sample_size: int
    timestamp: datetime
    metadata: Dict[str, Any] = None


@dataclass
class GuardrailBreach:
    """Detected guardrail breach"""
    guardrail_name: str
    metric_name: str
    variant: str
    breach_type: GuardrailType
    actual_value: float
    threshold: float
    severity: str
    detected_at: datetime
    description: str = ""


@dataclass
class ExperimentEvaluation:
    """Complete experiment evaluation result"""
    experiment_id: str
    evaluation_id: str
    timestamp: datetime
    metrics: List[MetricResult]
    guardrail_breaches: List[GuardrailBreach]
    statistical_tests: Dict[str, Any]
    recommendations: List[str]
    duration_seconds: float


class ExperimentEvaluationEngine:
    """Engine for multi-metric experiment evaluation and guardrail enforcement"""
    
    def __init__(self):
        self.metrics = {}
        self.guardrails = {}
        
        # Feature flag check
        self.enabled = os.getenv('ENABLE_EXPERIMENT_EVALUATION', 'false').lower() == 'true'
        if not self.enabled:
            logger.info("Experiment evaluation disabled by feature flag")
        
        # Load default metric and guardrail definitions
        self._load_default_definitions()

    def _load_default_definitions(self):
        """Load default metric and guardrail definitions"""
        # Default metrics
        default_metrics = [
            MetricDefinition(
                name="ctr",
                metric_type=MetricType.CTR,
                description="Click-through rate",
                aggregation="mean",
                higher_is_better=True,
                min_sample_size=100
            ),
            MetricDefinition(
                name="latency_p95",
                metric_type=MetricType.LATENCY,
                description="95th percentile response latency",
                aggregation="percentile_95",
                higher_is_better=False,
                min_sample_size=50
            ),
            MetricDefinition(
                name="diversity_score",
                metric_type=MetricType.DIVERSITY,
                description="Recommendation diversity score",
                aggregation="mean",
                higher_is_better=True,
                min_sample_size=50
            ),
            MetricDefinition(
                name="engagement_rate",
                metric_type=MetricType.ENGAGEMENT,
                description="User engagement rate",
                aggregation="mean",
                higher_is_better=True,
                min_sample_size=200
            ),
            MetricDefinition(
                name="conversion_rate",
                metric_type=MetricType.CONVERSION,
                description="Conversion rate",
                aggregation="mean",
                higher_is_better=True,
                min_sample_size=500
            )
        ]
        
        for metric in default_metrics:
            self.register_metric(metric)
        
        # Default guardrails
        default_guardrails = [
            GuardrailDefinition(
                name="latency_ceiling",
                metric_name="latency_p95",
                guardrail_type=GuardrailType.THRESHOLD,
                threshold=200.0,  # 200ms ceiling
                direction="upper",
                severity="critical",
                description="Response latency must not exceed 200ms"
            ),
            GuardrailDefinition(
                name="ctr_degradation",
                metric_name="ctr",
                guardrail_type=GuardrailType.DEGRADATION,
                threshold=0.05,  # 5% degradation
                direction="lower",
                severity="warning",
                description="CTR must not degrade by more than 5%"
            ),
            GuardrailDefinition(
                name="diversity_floor",
                metric_name="diversity_score",
                guardrail_type=GuardrailType.THRESHOLD,
                threshold=0.5,  # Minimum diversity
                direction="lower",
                severity="warning",
                description="Diversity score must not fall below 0.5"
            ),
            GuardrailDefinition(
                name="engagement_degradation",
                metric_name="engagement_rate",
                guardrail_type=GuardrailType.DEGRADATION,
                threshold=0.10,  # 10% degradation
                direction="lower",
                severity="critical",
                description="Engagement rate must not degrade by more than 10%"
            )
        ]
        
        for guardrail in default_guardrails:
            self.register_guardrail(guardrail)

    def register_metric(self, metric: MetricDefinition):
        """Register a metric definition"""
        self.metrics[metric.name] = metric
        logger.info(f"Registered metric: {metric.name}")

    def register_guardrail(self, guardrail: GuardrailDefinition):
        """Register a guardrail definition"""
        self.guardrails[guardrail.name] = guardrail
        logger.info(f"Registered guardrail: {guardrail.name}")

    def load_experiment_data(
        self,
        experiment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> pd.DataFrame:
        """
        Load experiment data for evaluation
        
        Args:
            experiment_id: Experiment identifier
            start_time: Start of evaluation window
            end_time: End of evaluation window
            
        Returns:
            DataFrame with columns: user_id, variant, timestamp, metrics...
        """
        if not self.enabled:
            return pd.DataFrame()
        
        try:
            # In production, this would query the experiment data store
            # For testing, generate synthetic experiment data
            
            np.random.seed(42)
            users = [f'user_{i}' for i in range(1000)]
            variants = ['control', 'treatment']
            
            data = []
            current_time = start_time
            
            while current_time < end_time:
                for user_id in np.random.choice(users, size=np.random.randint(50, 200)):
                    variant = np.random.choice(variants)
                    
                    # Simulate metrics with variant effects
                    if variant == 'treatment':
                        # Treatment has slightly better CTR but higher latency
                        ctr = np.random.beta(2, 8) + 0.01  # Slight CTR improvement
                        latency = np.random.lognormal(5.0, 0.5) + 10  # Slightly higher latency
                        diversity = np.random.beta(5, 3) + 0.1  # Better diversity
                        engagement = np.random.beta(3, 7) + 0.02  # Slight engagement boost
                    else:
                        # Control baseline
                        ctr = np.random.beta(2, 8)
                        latency = np.random.lognormal(5.0, 0.5)
                        diversity = np.random.beta(5, 3)
                        engagement = np.random.beta(3, 7)
                    
                    # Conversion depends on CTR
                    conversion = 1 if np.random.random() < ctr * 0.1 else 0
                    
                    data.append({
                        'user_id': user_id,
                        'variant': variant,
                        'timestamp': current_time,
                        'ctr': ctr,
                        'latency_p95': latency,
                        'diversity_score': diversity,
                        'engagement_rate': engagement,
                        'conversion_rate': conversion,
                        'experiment_id': experiment_id
                    })
                
                current_time += timedelta(hours=1)
            
            df = pd.DataFrame(data)
            logger.info(f"Loaded {len(df)} experiment data points for {experiment_id}")
            return df
            
        except Exception as e:
            logger.error(f"Failed to load experiment data: {e}")
            return pd.DataFrame()

    def calculate_metric(
        self,
        data: pd.DataFrame,
        metric_name: str,
        variant: str
    ) -> Optional[MetricResult]:
        """
        Calculate metric value for a variant
        
        Args:
            data: Experiment data
            metric_name: Name of metric to calculate
            variant: Variant to calculate for
            
        Returns:
            Metric result or None if insufficient data
        """
        if metric_name not in self.metrics:
            logger.warning(f"Unknown metric: {metric_name}")
            return None
        
        metric_def = self.metrics[metric_name]
        variant_data = data[data['variant'] == variant]
        
        if len(variant_data) < metric_def.min_sample_size:
            logger.warning(
                f"Insufficient sample size for {metric_name} in {variant}: "
                f"{len(variant_data)} < {metric_def.min_sample_size}"
            )
            return None
        
        # Extract metric values
        if metric_name not in variant_data.columns:
            logger.warning(f"Metric column {metric_name} not found in data")
            return None
        
        values = variant_data[metric_name].dropna()
        if len(values) == 0:
            return None
        
        # Calculate aggregate value
        if metric_def.aggregation == "mean":
            value = values.mean()
        elif metric_def.aggregation == "median":
            value = values.median()
        elif metric_def.aggregation == "sum":
            value = values.sum()
        elif metric_def.aggregation == "count":
            value = len(values)
        elif metric_def.aggregation == "percentile_95":
            value = values.quantile(0.95)
        else:
            logger.warning(f"Unknown aggregation: {metric_def.aggregation}")
            value = values.mean()
        
        # Calculate confidence interval
        confidence_interval = self._calculate_confidence_interval(
            values, metric_def.confidence_level
        )
        
        return MetricResult(
            metric_name=metric_name,
            variant=variant,
            value=value,
            confidence_interval=confidence_interval,
            sample_size=len(values),
            timestamp=datetime.now(timezone.utc),
            metadata={
                'aggregation': metric_def.aggregation,
                'confidence_level': metric_def.confidence_level
            }
        )

    def _calculate_confidence_interval(
        self,
        values: pd.Series,
        confidence_level: float
    ) -> Tuple[float, float]:
        """Calculate confidence interval for metric values"""
        if len(values) < 2:
            return (values.iloc[0], values.iloc[0])
        
        alpha = 1 - confidence_level
        degrees_freedom = len(values) - 1
        
        mean = values.mean()
        std_error = values.std() / math.sqrt(len(values))
        
        # Use t-distribution for small samples
        t_critical = stats.t.ppf(1 - alpha/2, degrees_freedom)
        margin_error = t_critical * std_error
        
        return (mean - margin_error, mean + margin_error)

    def check_guardrails(
        self,
        metrics: List[MetricResult],
        control_metrics: Dict[str, MetricResult] = None
    ) -> List[GuardrailBreach]:
        """
        Check guardrails against metric results
        
        Args:
            metrics: List of metric results to check
            control_metrics: Control variant metrics for degradation checks
            
        Returns:
            List of guardrail breaches
        """
        breaches = []
        metrics_by_name = {m.metric_name: m for m in metrics}
        
        for guardrail_name, guardrail in self.guardrails.items():
            metric_name = guardrail.metric_name
            
            if metric_name not in metrics_by_name:
                continue
            
            metric_result = metrics_by_name[metric_name]
            breach = None
            
            if guardrail.guardrail_type == GuardrailType.THRESHOLD:
                breach = self._check_threshold_guardrail(guardrail, metric_result)
            
            elif guardrail.guardrail_type == GuardrailType.DEGRADATION:
                if control_metrics and metric_name in control_metrics:
                    control_metric = control_metrics[metric_name]
                    breach = self._check_degradation_guardrail(
                        guardrail, metric_result, control_metric
                    )
            
            elif guardrail.guardrail_type == GuardrailType.STATISTICAL:
                if control_metrics and metric_name in control_metrics:
                    control_metric = control_metrics[metric_name]
                    breach = self._check_statistical_guardrail(
                        guardrail, metric_result, control_metric
                    )
            
            if breach:
                breaches.append(breach)
        
        return breaches

    def _check_threshold_guardrail(
        self,
        guardrail: GuardrailDefinition,
        metric: MetricResult
    ) -> Optional[GuardrailBreach]:
        """Check simple threshold guardrail"""
        value = metric.value
        threshold = guardrail.threshold
        
        breach_detected = False
        
        if guardrail.direction == "upper" and value > threshold:
            breach_detected = True
        elif guardrail.direction == "lower" and value < threshold:
            breach_detected = True
        elif guardrail.direction == "both" and (value > threshold or value < -threshold):
            breach_detected = True
        
        if breach_detected:
            return GuardrailBreach(
                guardrail_name=guardrail.name,
                metric_name=metric.metric_name,
                variant=metric.variant,
                breach_type=guardrail.guardrail_type,
                actual_value=value,
                threshold=threshold,
                severity=guardrail.severity,
                detected_at=datetime.now(timezone.utc),
                description=f"{guardrail.description} (actual: {value:.4f}, threshold: {threshold})"
            )
        
        return None

    def _check_degradation_guardrail(
        self,
        guardrail: GuardrailDefinition,
        treatment_metric: MetricResult,
        control_metric: MetricResult
    ) -> Optional[GuardrailBreach]:
        """Check relative degradation guardrail"""
        treatment_value = treatment_metric.value
        control_value = control_metric.value
        
        if control_value == 0:
            return None  # Cannot calculate relative change
        
        relative_change = (treatment_value - control_value) / control_value
        threshold = guardrail.threshold
        
        breach_detected = False
        
        if guardrail.direction == "lower" and relative_change < -threshold:
            breach_detected = True
        elif guardrail.direction == "upper" and relative_change > threshold:
            breach_detected = True
        
        if breach_detected:
            return GuardrailBreach(
                guardrail_name=guardrail.name,
                metric_name=treatment_metric.metric_name,
                variant=treatment_metric.variant,
                breach_type=guardrail.guardrail_type,
                actual_value=relative_change,
                threshold=threshold,
                severity=guardrail.severity,
                detected_at=datetime.now(timezone.utc),
                description=(
                    f"{guardrail.description} "
                    f"(degradation: {relative_change:.2%}, threshold: {threshold:.2%})"
                )
            )
        
        return None

    def _check_statistical_guardrail(
        self,
        guardrail: GuardrailDefinition,
        treatment_metric: MetricResult,
        control_metric: MetricResult
    ) -> Optional[GuardrailBreach]:
        """Check statistical significance guardrail"""
        # This would require access to raw data for proper statistical test
        # For now, use confidence intervals as a proxy
        treatment_ci = treatment_metric.confidence_interval
        control_ci = control_metric.confidence_interval
        
        # Check if confidence intervals overlap
        overlap = not (treatment_ci[1] < control_ci[0] or control_ci[1] < treatment_ci[0])
        
        # If no overlap and treatment is worse, it's a breach
        treatment_worse = (
            (treatment_metric.value < control_metric.value and 
             self.metrics[treatment_metric.metric_name].higher_is_better) or
            (treatment_metric.value > control_metric.value and 
             not self.metrics[treatment_metric.metric_name].higher_is_better)
        )
        
        if not overlap and treatment_worse:
            return GuardrailBreach(
                guardrail_name=guardrail.name,
                metric_name=treatment_metric.metric_name,
                variant=treatment_metric.variant,
                breach_type=guardrail.guardrail_type,
                actual_value=treatment_metric.value,
                threshold=control_metric.value,
                severity=guardrail.severity,
                detected_at=datetime.now(timezone.utc),
                description=f"{guardrail.description} (statistically significant degradation)"
            )
        
        return None

    def run_statistical_tests(
        self,
        treatment_metrics: List[MetricResult],
        control_metrics: List[MetricResult]
    ) -> Dict[str, Any]:
        """
        Run statistical tests comparing treatment vs control
        
        Args:
            treatment_metrics: Treatment variant metrics
            control_metrics: Control variant metrics
            
        Returns:
            Dictionary of statistical test results
        """
        results = {}
        
        treatment_by_name = {m.metric_name: m for m in treatment_metrics}
        control_by_name = {m.metric_name: m for m in control_metrics}
        
        common_metrics = set(treatment_by_name.keys()) & set(control_by_name.keys())
        
        for metric_name in common_metrics:
            treatment = treatment_by_name[metric_name]
            control = control_by_name[metric_name]
            
            # Calculate effect size and statistical significance
            effect_size = treatment.value - control.value
            relative_effect = effect_size / control.value if control.value != 0 else 0
            
            # Simple significance test using confidence intervals
            treatment_ci = treatment.confidence_interval
            control_ci = control.confidence_interval
            significant = not (treatment_ci[1] < control_ci[0] or control_ci[1] < treatment_ci[0])
            
            results[metric_name] = {
                'treatment_value': treatment.value,
                'control_value': control.value,
                'effect_size': effect_size,
                'relative_effect': relative_effect,
                'statistically_significant': significant,
                'treatment_ci': treatment_ci,
                'control_ci': control_ci
            }
        
        return results

    def generate_recommendations(
        self,
        breaches: List[GuardrailBreach],
        statistical_tests: Dict[str, Any]
    ) -> List[str]:
        """
        Generate actionable recommendations based on evaluation results
        
        Args:
            breaches: List of guardrail breaches
            statistical_tests: Statistical test results
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Check for critical breaches
        critical_breaches = [b for b in breaches if b.severity == "critical"]
        if critical_breaches:
            recommendations.append(
                f"🚨 IMMEDIATE ACTION REQUIRED: {len(critical_breaches)} critical guardrail breaches detected. "
                "Consider disabling the experiment variant."
            )
        
        # Check for warning breaches
        warning_breaches = [b for b in breaches if b.severity == "warning"]
        if warning_breaches:
            recommendations.append(
                f"⚠️  {len(warning_breaches)} warning-level guardrail breaches detected. "
                "Monitor closely and consider parameter tuning."
            )
        
        # Check for significant positive results
        positive_results = []
        for metric_name, result in statistical_tests.items():
            if result['statistically_significant'] and result['relative_effect'] > 0.02:  # 2% improvement
                positive_results.append(metric_name)
        
        if positive_results:
            recommendations.append(
                f"✅ Significant improvements detected in: {', '.join(positive_results)}. "
                "Consider rolling out if no critical breaches."
            )
        
        # Check for inconclusive results
        inconclusive_metrics = []
        for metric_name, result in statistical_tests.items():
            if not result['statistically_significant'] and abs(result['relative_effect']) < 0.01:
                inconclusive_metrics.append(metric_name)
        
        if inconclusive_metrics:
            recommendations.append(
                f"📊 Inconclusive results for: {', '.join(inconclusive_metrics)}. "
                "Consider extending experiment duration or increasing sample size."
            )
        
        if not recommendations:
            recommendations.append("✅ No significant issues detected. Continue monitoring experiment.")
        
        return recommendations

    def evaluate_experiment(
        self,
        experiment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> ExperimentEvaluation:
        """
        Complete experiment evaluation pipeline
        
        Args:
            experiment_id: Experiment identifier
            start_time: Evaluation window start
            end_time: Evaluation window end
            
        Returns:
            Complete experiment evaluation result
        """
        eval_start_time = time.time()
        
        if not self.enabled:
            logger.info("Experiment evaluation disabled by feature flag")
            return self._empty_evaluation(experiment_id)
        
        try:
            # Load experiment data
            data = self.load_experiment_data(experiment_id, start_time, end_time)
            
            if data.empty:
                logger.warning(f"No data found for experiment {experiment_id}")
                return self._empty_evaluation(experiment_id)
            
            # Calculate metrics for each variant
            variants = data['variant'].unique()
            all_metrics = []
            
            for variant in variants:
                for metric_name in self.metrics.keys():
                    metric_result = self.calculate_metric(data, metric_name, variant)
                    if metric_result:
                        all_metrics.append(metric_result)
            
            # Separate control and treatment metrics
            control_metrics = {m.metric_name: m for m in all_metrics if m.variant == 'control'}
            treatment_metrics = [m for m in all_metrics if m.variant != 'control']
            
            # Check guardrails
            breaches = []
            for metric in treatment_metrics:
                variant_breaches = self.check_guardrails([metric], control_metrics)
                breaches.extend(variant_breaches)
            
            # Run statistical tests
            statistical_tests = self.run_statistical_tests(treatment_metrics, list(control_metrics.values()))
            
            # Generate recommendations
            recommendations = self.generate_recommendations(breaches, statistical_tests)
            
            # Create evaluation result
            evaluation = ExperimentEvaluation(
                experiment_id=experiment_id,
                evaluation_id=f"eval_{int(time.time())}",
                timestamp=datetime.now(timezone.utc),
                metrics=all_metrics,
                guardrail_breaches=breaches,
                statistical_tests=statistical_tests,
                recommendations=recommendations,
                duration_seconds=time.time() - eval_start_time
            )
            
            logger.info(
                f"Experiment evaluation completed for {experiment_id}: "
                f"{len(all_metrics)} metrics, {len(breaches)} breaches"
            )
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Experiment evaluation failed: {e}")
            return self._empty_evaluation(experiment_id)

    def _empty_evaluation(self, experiment_id: str) -> ExperimentEvaluation:
        """Create empty evaluation result for error cases"""
        return ExperimentEvaluation(
            experiment_id=experiment_id,
            evaluation_id=f"eval_empty_{int(time.time())}",
            timestamp=datetime.now(timezone.utc),
            metrics=[],
            guardrail_breaches=[],
            statistical_tests={},
            recommendations=["Evaluation failed - check logs for details"],
            duration_seconds=0.0
        )

    def save_evaluation_report(
        self,
        evaluation: ExperimentEvaluation,
        output_path: str = None
    ) -> str:
        """
        Save evaluation report to file
        
        Args:
            evaluation: Evaluation result to save
            output_path: Output file path (auto-generated if None)
            
        Returns:
            Path to saved report
        """
        if output_path is None:
            timestamp = evaluation.timestamp.strftime("%Y%m%d_%H%M%S")
            output_path = f"experiment_evaluation_{evaluation.experiment_id}_{timestamp}.json"
        
        try:
            report_data = {
                'evaluation': asdict(evaluation),
                'summary': {
                    'total_metrics': len(evaluation.metrics),
                    'total_breaches': len(evaluation.guardrail_breaches),
                    'critical_breaches': len([b for b in evaluation.guardrail_breaches if b.severity == "critical"]),
                    'warning_breaches': len([b for b in evaluation.guardrail_breaches if b.severity == "warning"]),
                    'evaluation_duration_ms': round(evaluation.duration_seconds * 1000, 2)
                }
            }
            
            with open(output_path, 'w') as f:
                json.dump(report_data, f, indent=2, default=str)
            
            logger.info(f"Saved evaluation report to {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to save evaluation report: {e}")
            return ""