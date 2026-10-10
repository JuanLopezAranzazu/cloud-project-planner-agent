import { forwardRef, useState } from 'react';
import {
  Badge, Box, Button, Flex, Heading, HStack, Icon, Stack, Text, Wrap, WrapItem, useToast,
} from '@chakra-ui/react';
import {
  ArrowRight, Check, Clipboard, Download, Flag, Lightbulb, Plus, ShieldAlert, Wallet,
} from 'lucide-react';
import type { Plan } from '../types';
import { planToMarkdown, tierLabel } from '../markdown';

const TIER_COLOR: Record<Plan['cost']['tier'], string> = {
  'free-tier': 'green', low: 'blue', medium: 'orange', high: 'red',
};

function SectionTitle({ icon, children }: { icon: typeof Flag; children: string }) {
  return (
    <HStack spacing={2} mb={4}>
      <Icon as={icon} boxSize={5} color="sky.600" />
      <Heading as="h3" fontSize="2xl">{children}</Heading>
    </HStack>
  );
}

const Panel = ({ children }: { children: React.ReactNode }) => (
  <Box bg="white" borderWidth="1px" borderColor="rule" rounded="2xl" p={{ base: 5, md: 7 }}>{children}</Box>
);

interface Props {
  plan: Plan;
  onReset: () => void;
}

export const PlanView = forwardRef<HTMLHeadingElement, Props>(function PlanView({ plan, onReset }, headingRef) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planToMarkdown(plan));
      setCopied(true);
      toast({ title: 'Plan copied as Markdown', status: 'success', duration: 2500, position: 'bottom' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Couldn\'t copy', description: 'Try “Download .md” instead.', status: 'warning', duration: 4000 });
    }
  };

  const download = () => {
    const blob = new Blob([planToMarkdown(plan)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={6}>
      {/* Plan header */}
      <Box>
        <Heading as="h2" ref={headingRef} tabIndex={-1} fontSize={{ base: '3xl', md: '5xl' }} _focus={{ outline: 'none' }}>
          {plan.title}
        </Heading>
        <Text mt={2} fontSize="xl" color="sky.700" fontFamily="heading" fontWeight={500}>{plan.tagline}</Text>
        <Text mt={4} maxW="68ch">{plan.summary}</Text>
        <HStack mt={5} spacing={3} flexWrap="wrap" rowGap={2}>
          <Button size="sm" onClick={copy} leftIcon={<Icon as={copied ? Check : Clipboard} boxSize={4} />} bg="ink" color="white" _hover={{ bg: 'blueprint' }}>
            Copy as Markdown
          </Button>
          <Button size="sm" variant="outline" onClick={download} leftIcon={<Icon as={Download} boxSize={4} />}>
            Download .md
          </Button>
          <Button size="sm" variant="ghost" onClick={onReset} leftIcon={<Icon as={Plus} boxSize={4} />}>
            New idea
          </Button>
        </HStack>
      </Box>

      {/* The blueprint: a request flow */}
      <Box
        bg="blueprint"
        color="white"
        rounded="2xl"
        p={{ base: 5, md: 7 }}
        backgroundImage="linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)"
        backgroundSize="24px 24px"
      >
        <Text fontFamily="heading" fontSize="lg" fontWeight={500} color="whiteAlpha.800">
          Pattern: {plan.architecture.pattern}
        </Text>
        <Text fontSize="sm" color="whiteAlpha.800" mb={4}>How a typical request travels:</Text>
        <Flex wrap="wrap" align="center" gap={2} as="ol" listStyleType="none">
          {plan.architecture.flow.map((step, i) => (
            <Flex as="li" key={`${step}-${i}`} align="center" gap={2}>
              <Box px={3} py={1.5} border="1.5px dashed" borderColor="marker" rounded="md" bg="blackAlpha.300" fontWeight={500} fontSize="sm">
                {step}
              </Box>
              {i < plan.architecture.flow.length - 1 && <Icon as={ArrowRight} boxSize={4} color="marker" aria-label="then" />}
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* Services */}
      <Panel>
        <SectionTitle icon={Flag}>AWS services</SectionTitle>
        <Stack spacing={0} divider={<Box borderTopWidth="1px" borderColor="rule" />}>
          {plan.architecture.services.map((s) => (
            <Box key={s.name} py={4} _first={{ pt: 0 }} _last={{ pb: 0 }}>
              <Text fontFamily="heading" fontWeight={700} fontSize="lg">{s.name}</Text>
              <Text>{s.role}</Text>
              <Text color="muted" fontSize="sm" mt={1}>{s.why}</Text>
            </Box>
          ))}
        </Stack>
      </Panel>

      {/* Roadmap: this one really is a sequence */}
      <Panel>
        <SectionTitle icon={Flag}>Roadmap</SectionTitle>
        <Stack spacing={6} as="ol" listStyleType="none">
          {plan.roadmap.map((r, i) => (
            <Flex as="li" key={`${r.phase}-${i}`} gap={4}>
              <Flex direction="column" align="center">
                <Flex boxSize={8} rounded="full" bg="ink" color="white" align="center" justify="center" fontWeight={700} fontSize="sm" flexShrink={0}>
                  {i + 1}
                </Flex>
                {i < plan.roadmap.length - 1 && <Box flex={1} w="2px" bg="rule" mt={2} />}
              </Flex>
              <Box pb={2}>
                <HStack spacing={3} flexWrap="wrap">
                  <Text fontFamily="heading" fontWeight={700} fontSize="lg">{r.title}</Text>
                  <Badge colorScheme="blue" rounded="md" textTransform="none">{r.duration}</Badge>
                </HStack>
                <Stack as="ul" mt={2} spacing={1} pl={5}>
                  {r.tasks.map((t) => <Text as="li" key={t}>{t}</Text>)}
                </Stack>
              </Box>
            </Flex>
          ))}
        </Stack>
      </Panel>

      {/* Costs and risks */}
      <Flex gap={6} direction={{ base: 'column', md: 'row' }} align="stretch">
        <Box flex={1}><Panel>
          <SectionTitle icon={Wallet}>Costs</SectionTitle>
          <HStack spacing={3} mb={2} flexWrap="wrap">
            <Badge colorScheme={TIER_COLOR[plan.cost.tier]} fontSize="sm" px={2} py={0.5} rounded="md" textTransform="none">
              {tierLabel(plan.cost.tier)}
            </Badge>
            <Text fontFamily="heading" fontWeight={700} fontSize="xl">USD {plan.cost.monthlyEstimateUsd} / month</Text>
          </HStack>
          <Text color="muted" fontSize="sm">{plan.cost.notes}</Text>
        </Panel></Box>

        <Box flex={1}><Panel>
          <SectionTitle icon={ShieldAlert}>Risks</SectionTitle>
          <Stack spacing={4}>
            {plan.risks.map((r) => (
              <Box key={r.risk}>
                <Text fontWeight={600}>{r.risk}</Text>
                <Text color="muted" fontSize="sm">{r.mitigation}</Text>
              </Box>
            ))}
          </Stack>
        </Panel></Box>
      </Flex>

      {/* First step: the highlighter */}
      <Box bg="marker" color="ink" rounded="2xl" p={{ base: 5, md: 7 }}>
        <HStack spacing={2} mb={2}>
          <Icon as={Lightbulb} boxSize={5} />
          <Heading as="h3" fontSize="2xl">Your first step, today</Heading>
        </HStack>
        <Text fontSize="lg" maxW="60ch">{plan.nextStep}</Text>
      </Box>

      <Wrap>
        <WrapItem>
          <Text fontSize="sm" color="muted">
            Cost estimates are approximate. Check the AWS Pricing Calculator before deploying.
          </Text>
        </WrapItem>
      </Wrap>
    </Stack>
  );
});
