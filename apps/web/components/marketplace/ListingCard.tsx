"use client";

import { useState } from "react";
import { useMarketplace, useToggleUpvote, useCopyMarketplaceTemplate } from "@/hooks/useMarketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowUp, Copy, Search, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Survey", "Contact", "Job Application", "Feedback", "Registration", "Lead Generation", "Event"];

export function MarketplaceBrowser() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"upvotes" | "newest" | "copies">("upvotes");
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useMarketplace({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    sort: sortBy,
    q: search || undefined,
  });

  const toggleUpvote = useToggleUpvote();
  const copyTemplate = useCopyMarketplaceTemplate();

  const sortedListings = [...(listings || [])].sort((a, b) => {
    if (sortBy === "upvotes") return (b.upvoteCount || 0) - (a.upvoteCount || 0);
    if (sortBy === "copies") return (b.copyCount || 0) - (a.copyCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">🏪 Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Discover and use templates created by the community
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-6">
        {(["upvotes", "newest", "copies"] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={cn(
              "px-3 py-1 rounded text-sm transition-colors",
              sortBy === sort
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {sort === "upvotes" && "↑ Most Upvoted"}
            {sort === "newest" && "🕐 Newest"}
            {sort === "copies" && "📋 Most Used"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sortedListings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No templates found. Try a different search or category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedListings.map((listing: any) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onUpvote={() => toggleUpvote.mutate(listing.id)}
              onCopy={() => copyTemplate.mutate(listing.id)}
              isUpvoting={toggleUpvote.isPending}
              isCopying={copyTemplate.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  onUpvote,
  onCopy,
  isUpvoting,
  isCopying,
}: {
  listing: {
    id: string;
    title: string;
    description?: string;
    category?: string;
    upvoteCount?: number;
    copyCount?: number;
    publisherId?: string;
  };
  onUpvote: () => void;
  onCopy: () => void;
  isUpvoting: boolean;
  isCopying: boolean;
}) {
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const handleUpvote = () => {
    setHasUpvoted(!hasUpvoted);
    onUpvote();
  };

  return (
    <Card className="flex flex-col hover:border-primary/50 transition-colors">
      <CardContent className="pt-4 flex-1">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
            {listing.category || "General"}
          </span>
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
              hasUpvoted
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ArrowUp className="w-3 h-3" />
            {listing.upvoteCount || 0}
          </button>
        </div>
        <h3 className="font-semibold mb-1">{listing.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {listing.description || "No description provided"}
        </p>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCopy}
          disabled={isCopying}
        >
          <Copy className="w-4 h-4 mr-1" />
          {isCopying ? "Copying..." : "Use This"}
        </Button>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          📋{listing.copyCount || 0}
        </span>
      </CardFooter>
    </Card>
  );
}
