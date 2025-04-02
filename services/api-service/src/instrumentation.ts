import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { B3InjectEncoding, B3Propagator } from "@opentelemetry/propagator-b3";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import process from "process";

const metricReader = new PrometheusExporter({
    port: 8081
});

const traceExporter = new OTLPTraceExporter({
    url: "http://otel-collector:4318/v1/traces"
});

const spanProcessor = new BatchSpanProcessor(traceExporter);

const otelSDK = new NodeSDK({
    metricReader,
    spanProcessor: spanProcessor,
    contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [getNodeAutoInstrumentations()],
    textMapPropagator: new CompositePropagator({
        propagators: [
            new W3CTraceContextPropagator(),
            new W3CBaggagePropagator(),
            new B3Propagator(),
            new B3Propagator({
                injectEncoding: B3InjectEncoding.MULTI_HEADER
            })
        ]
    })
});

export default otelSDK;
// You can also use the shutdown method to gracefully shut down the SDK before process shutdown
// or on some operating system signal.
process.on("SIGTERM", () => {
    otelSDK
        .shutdown()
        .then(
            () => console.log("SDK shut down successfully"),
            (err) => console.log("Error shutting down SDK", err)
        )
        .finally(() => process.exit(0));
});
